import { Hono } from 'hono';
import { type ApiVariables, type SessionAuth } from '../../middleware/auth.js';
import type { PlatformService } from '../../services/platform/platform.service.js';
import { createPlatformController } from '../../controllers/platform.controller.js';

export function createPlatformRoutes(auth: SessionAuth, platform: PlatformService) {
  const app = new Hono<{ Variables: ApiVariables }>();
  const controller = createPlatformController(auth, platform);

  app.get('/access', ...controller.access);
  app.post('/institutions', ...controller.createInstitution);
  app.get('/institutions', ...controller.listInstitutions);
  app.get('/institutions/:institutionId', ...controller.institution);
  app.put('/institutions/:institutionId/status', ...controller.updateStatus);
  app.put('/institutions/:institutionId/modules', ...controller.updateModules);
  app.get('/institutions/:institutionId/subscription', ...controller.subscription);
  app.put('/institutions/:institutionId/subscription', ...controller.updateSubscription);
  app.get('/subscriptions', ...controller.listSubscriptions);
  app.get('/operators', ...controller.listOperators);
  app.put('/operators/:userId', ...controller.updateOperator);
  return app;
}
