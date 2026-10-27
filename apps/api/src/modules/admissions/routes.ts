import { Hono } from 'hono';
import { validator } from 'hono/validator';
import { z } from 'zod';
import {
  admissionSettingsInputSchema,
  admissionSettingsSchema,
  admissionSetupSchema,
  candidateActionSchema,
  candidateCreateSchema,
  candidateDetailSchema,
  candidateListQuerySchema,
  candidateListSchema,
  offeringInputSchema,
  offeringSchema,
  admissionNotificationsSchema,
  monthlyCollectionSchema,
  stopMonthlyBillingSchema,
} from '@eduos/contracts';
import { requireSession, type ApiVariables, type SessionAuth } from '../../middleware/auth.js';
import { invalidRequest } from '../../lib/errors.js';
import type { AdmissionsService } from './service.js';
function validated<T extends z.ZodType>(schema: T, value: unknown): z.output<T> {
  const result = schema.safeParse(value);
  if (!result.success) invalidRequest();
  return result.data;
}
const paramsSchema = z.object({
  institutionId: z.uuid(),
  candidateId: z.uuid().optional(),
  notificationId: z.uuid().optional(),
  chargeId: z.uuid().optional(),
  scheduleId: z.uuid().optional(),
});
export function createAdmissionsRoutes(auth: SessionAuth, admissions: AdmissionsService) {
  const app = new Hono<{ Variables: ApiVariables }>();
  app.use('*', requireSession(auth));
  const params = validator('param', (value) => validated(paramsSchema, value));
  app.get('/setup', params, async (c) =>
    c.json(
      admissionSetupSchema.parse(
        await admissions.setup(c.get('identity').id, c.req.valid('param').institutionId),
      ),
    ),
  );
  app.put(
    '/settings',
    params,
    validator('json', (value) => validated(admissionSettingsInputSchema, value)),
    async (c) =>
      c.json(
        admissionSettingsSchema.parse(
          await admissions.updateSettings(
            c.get('identity').id,
            c.req.valid('param').institutionId,
            c.req.valid('json'),
          ),
        ),
      ),
  );
  app.post(
    '/offerings',
    params,
    validator('json', (value) => validated(offeringInputSchema, value)),
    async (c) =>
      c.json(
        offeringSchema.parse(
          await admissions.addOffering(
            c.get('identity').id,
            c.req.valid('param').institutionId,
            c.req.valid('json'),
          ),
        ),
        201,
      ),
  );
  app.get(
    '/candidates',
    params,
    validator('query', (value) => validated(candidateListQuerySchema, value)),
    async (c) =>
      c.json(
        candidateListSchema.parse(
          await admissions.list(
            c.get('identity').id,
            c.req.valid('param').institutionId,
            c.req.valid('query'),
          ),
        ),
      ),
  );
  app.post(
    '/candidates',
    params,
    validator('json', (value) => validated(candidateCreateSchema, value)),
    async (c) =>
      c.json(
        candidateDetailSchema.parse(
          await admissions.create(
            c.get('identity').id,
            c.req.valid('param').institutionId,
            c.req.valid('json'),
          ),
        ),
        201,
      ),
  );
  app.get('/candidates/:candidateId', params, async (c) =>
    c.json(
      candidateDetailSchema.parse(
        await admissions.detail(
          c.get('identity').id,
          c.req.valid('param').institutionId,
          validated(z.uuid(), c.req.valid('param').candidateId),
        ),
      ),
    ),
  );
  app.post(
    '/candidates/:candidateId/actions',
    params,
    validator('json', (value) => validated(candidateActionSchema, value)),
    async (c) =>
      c.json(
        candidateDetailSchema.parse(
          await admissions.act(
            c.get('identity').id,
            c.req.valid('param').institutionId,
            validated(z.uuid(), c.req.valid('param').candidateId),
            c.req.valid('json'),
          ),
        ),
      ),
  );
  app.get('/notifications', params, async (c) =>
    c.json(
      admissionNotificationsSchema.parse(
        await admissions.notifications(c.get('identity').id, c.req.valid('param').institutionId),
      ),
    ),
  );
  app.put('/notifications/:notificationId/read', params, async (c) =>
    c.json(
      await admissions.readNotification(
        c.get('identity').id,
        c.req.valid('param').institutionId,
        validated(z.uuid(), c.req.valid('param').notificationId),
      ),
    ),
  );
  app.post(
    '/candidates/:candidateId/monthly-charges/:chargeId/collect',
    params,
    validator('json', (value) => validated(monthlyCollectionSchema, value)),
    async (c) => {
      const { institutionId, candidateId, chargeId } = c.req.valid('param');
      if (!candidateId || !chargeId) invalidRequest();
      return c.json(
        candidateDetailSchema.parse(
          await admissions.collectMonthlyFee(
            c.get('identity').id,
            institutionId,
            candidateId,
            chargeId,
          ),
        ),
      );
    },
  );
  app.post(
    '/candidates/:candidateId/monthly-schedules/:scheduleId/stop',
    params,
    validator('json', (value) => validated(stopMonthlyBillingSchema, value)),
    async (c) => {
      const { institutionId, candidateId, scheduleId } = c.req.valid('param');
      if (!candidateId || !scheduleId) invalidRequest();
      return c.json(
        candidateDetailSchema.parse(
          await admissions.stopMonthlyFee(
            c.get('identity').id,
            institutionId,
            candidateId,
            scheduleId,
          ),
        ),
      );
    },
  );
  return app;
}
