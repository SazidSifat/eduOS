import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { bodyLimit } from 'hono/body-limit';
import { HTTPException } from 'hono/http-exception';
import { validator } from 'hono/validator';
import { z } from 'zod';
import type { Auth } from '@eduos/auth/server';
import {
  healthSchema,
  readySchema,
  identitySchema,
  membershipsSchema,
  workspaceSchema,
  institutionIdSchema,
} from '@eduos/contracts';
import type { ApiEnv } from '../config/env.js';
import type { Logger } from '../lib/logger.js';
import type { IdentityService } from '../modules/identity/service.js';
import { requireSession, requireTenant, type ApiVariables } from '../middleware/auth.js';
import { openapi } from './openapi.js';
export interface AppDependencies {
  env: ApiEnv;
  auth: Auth;
  logger: Logger;
  identity: IdentityService;
  checkDatabase: () => Promise<void>;
}
export function createApp({ env, auth, logger, identity, checkDatabase }: AppDependencies) {
  const app = new Hono<{ Variables: ApiVariables }>();
  app.use('*', async (c, next) => {
    const id = randomUUID();
    c.set('requestId', id);
    c.header('X-Request-ID', id);
    const start = performance.now();
    await next();
    logger.write('info', {
      event: 'request',
      requestId: id,
      method: c.req.method,
      status: c.res.status,
      durationMs: Math.round(performance.now() - start),
    });
  });
  app.use('*', secureHeaders());
  app.use(
    '/api/*',
    cors({
      origin: env.CORS_TRUSTED_ORIGINS,
      credentials: true,
      allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type'],
      exposeHeaders: ['X-Request-ID'],
      maxAge: 600,
    }),
  );
  app.use(
    '/api/*',
    bodyLimit({
      maxSize: 16 * 1024,
      onError: (c) =>
        c.json(
          {
            error: {
              code: 'PAYLOAD_TOO_LARGE',
              message: 'Request body too large',
              requestId: c.get('requestId'),
            },
          },
          413,
        ),
    }),
  );
  app.use('/api/v1/*', async (c, next) => {
    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(c.req.method) &&
      !env.CORS_TRUSTED_ORIGINS.includes(c.req.header('origin') ?? '')
    )
      throw new HTTPException(403);
    c.header('Cache-Control', 'no-store');
    await next();
  });
  app.get('/api/health', (c) => c.json(healthSchema.parse({ status: 'ok', service: 'eduos-api' })));
  app.get('/api/ready', async (c) => {
    try {
      await checkDatabase();
      return c.json(readySchema.parse({ status: 'ready' }));
    } catch {
      return c.json(
        {
          error: {
            code: 'NOT_READY',
            message: 'Critical dependency unavailable',
            requestId: c.get('requestId'),
          },
        },
        503,
      );
    }
  });
  app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));
  const session = requireSession(auth);
  app.get('/api/v1/me', session, (c) => c.json(identitySchema.parse(c.get('identity'))));
  app.get('/api/v1/memberships', session, async (c) =>
    c.json(membershipsSchema.parse(await identity.listMemberships(c.get('identity').id))),
  );
  app.get(
    '/api/v1/institutions/:institutionId/workspace',
    session,
    validator('param', (value, c) => {
      const result = z.object({ institutionId: institutionIdSchema }).safeParse(value);
      if (!result.success)
        return c.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid institution ID',
              requestId: c.get('requestId'),
            },
          },
          400,
        );
      return result.data;
    }),
    requireTenant(identity.resolver, 'workspace.read'),
    async (c) =>
      c.json(
        workspaceSchema.parse(
          await identity.getWorkspace(c.get('identity').id, c.req.valid('param').institutionId),
        ),
      ),
  );
  app.get('/api/openapi.json', (c) => c.json(openapi));
  app.notFound((c) =>
    c.json(
      { error: { code: 'NOT_FOUND', message: 'Route not found', requestId: c.get('requestId') } },
      404,
    ),
  );
  app.onError((error, c) => {
    const status = error instanceof HTTPException ? error.status : 500;
    const codes: Record<number, string> = {
      400: 'VALIDATION_ERROR',
      401: 'UNAUTHENTICATED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      413: 'PAYLOAD_TOO_LARGE',
      429: 'RATE_LIMITED',
    };
    logger.write('error', {
      event: status >= 500 ? 'unhandled_error' : 'request_rejected',
      requestId: c.get('requestId'),
      status,
    });
    return c.json(
      {
        error: {
          code: codes[status] ?? 'INTERNAL_ERROR',
          message: status >= 500 ? 'Unexpected server error' : 'Request rejected',
          requestId: c.get('requestId'),
        },
      },
      status,
    );
  });
  return app;
}
