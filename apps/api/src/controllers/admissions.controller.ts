import { createFactory } from 'hono/factory';
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
import { type ApiVariables } from '../middleware/auth.js';
import { invalidRequest } from '../lib/errors.js';
import type { AdmissionsService } from '../services/admissions/admissions.service.js';
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
export function createAdmissionsController(admissions: AdmissionsService) {
  const factory = createFactory<{ Variables: ApiVariables }>();

  const params = validator('param', (value) => validated(paramsSchema, value));
  const setup = factory.createHandlers(params, async (c) =>
    c.json(
      admissionSetupSchema.parse(
        await admissions.setup(c.get('identity').id, c.req.valid('param').institutionId),
      ),
    ),
  );
  const updateSettings = factory.createHandlers(
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
  const addOffering = factory.createHandlers(
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
  const listCandidates = factory.createHandlers(
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
  const createCandidate = factory.createHandlers(
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
  const candidate = factory.createHandlers(params, async (c) =>
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
  const candidateAction = factory.createHandlers(
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
  const notifications = factory.createHandlers(params, async (c) =>
    c.json(
      admissionNotificationsSchema.parse(
        await admissions.notifications(c.get('identity').id, c.req.valid('param').institutionId),
      ),
    ),
  );
  const readNotification = factory.createHandlers(params, async (c) =>
    c.json(
      await admissions.readNotification(
        c.get('identity').id,
        c.req.valid('param').institutionId,
        validated(z.uuid(), c.req.valid('param').notificationId),
      ),
    ),
  );
  const collectMonthlyFee = factory.createHandlers(
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
  const stopMonthlyFee = factory.createHandlers(
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
  return {
    setup,
    updateSettings,
    addOffering,
    listCandidates,
    createCandidate,
    candidate,
    candidateAction,
    notifications,
    readNotification,
    collectMonthlyFee,
    stopMonthlyFee,
  };
}
