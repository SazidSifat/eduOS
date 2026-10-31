import { createFactory } from 'hono/factory';
import { validator } from 'hono/validator';
import { z } from 'zod';
import {
  schoolSnapshotSchema,
  schoolCommandSchema,
  schoolCommandResultSchema,
  schoolEvidenceInputSchema,
  schoolEvidenceSchema,
  enrollmentHistorySchema,
  enrollmentHistoryQuerySchema,
} from '@eduos/contracts';
import { type ApiVariables } from '../middleware/auth.js';
import { invalidRequest } from '../lib/errors.js';
import type { SchoolService } from '../services/school/school.service.js';
function validated<T extends z.ZodType>(schema: T, raw: unknown): z.output<T> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) invalidRequest();
  return parsed.data;
}
export function createSchoolController(service: SchoolService) {
  const factory = createFactory<{ Variables: ApiVariables }>();

  const params = validator('param', (raw) =>
    validated(z.object({ institutionId: z.uuid(), evidenceId: z.uuid().optional() }), raw),
  );
  const snapshot = factory.createHandlers(params, async (c) =>
    c.json(
      schoolSnapshotSchema.parse(
        await service.snapshot(c.get('identity').id, c.req.valid('param').institutionId),
      ),
    ),
  );
  const enrollmentHistory = factory.createHandlers(
    validator('param', (raw) =>
      validated(z.strictObject({ institutionId: z.uuid(), enrollmentId: z.uuid() }), raw),
    ),
    validator('query', (raw) => validated(enrollmentHistoryQuerySchema, raw)),
    async (c) => {
      const p = c.req.valid('param');
      return c.json(
        enrollmentHistorySchema.parse(
          await service.enrollmentHistory(
            c.get('identity').id,
            p.institutionId,
            p.enrollmentId,
            c.req.valid('query'),
          ),
        ),
      );
    },
  );
  const command = factory.createHandlers(
    params,
    validator('json', (raw) => validated(schoolCommandSchema, raw)),
    async (c) =>
      c.json(
        schoolCommandResultSchema.parse(
          await service.command(
            c.get('identity').id,
            c.req.valid('param').institutionId,
            c.req.valid('json'),
          ),
        ),
      ),
  );
  const uploadEvidence = factory.createHandlers(
    params,
    validator('json', (raw) => validated(schoolEvidenceInputSchema, raw)),
    async (c) =>
      c.json(
        schoolEvidenceSchema.parse(
          await service.uploadEvidence(
            c.get('identity').id,
            c.req.valid('param').institutionId,
            c.req.valid('json'),
          ),
        ),
        201,
      ),
  );
  const evidence = factory.createHandlers(params, async (c) => {
    const p = c.req.valid('param');
    if (!p.evidenceId) invalidRequest();
    const row = await service.evidence(c.get('identity').id, p.institutionId, p.evidenceId);
    c.header('Content-Type', row.mediaType);
    c.header('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(row.name)}`);
    c.header('X-Content-Type-Options', 'nosniff');
    return c.body(new Uint8Array(Buffer.from(row.content, 'base64')));
  });
  return { snapshot, enrollmentHistory, command, uploadEvidence, evidence };
}
