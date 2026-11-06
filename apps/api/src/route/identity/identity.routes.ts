import { Hono } from 'hono';
import { type ApiVariables, type SessionAuth } from '../../middleware/auth.js';
import type { IdentityService } from '../../services/identity/identity.service.js';
import { createIdentityController } from '../../controllers/identity.controller.js';

export function createIdentityRoutes(auth: SessionAuth, identity: IdentityService) {
  const app = new Hono<{ Variables: ApiVariables }>();
  const controller = createIdentityController(auth, identity);

  app.get('/me', ...controller.me);
  app.get('/memberships', ...controller.listMemberships);
  app.get('/institutions/:institutionId/workspace', ...controller.workspace);
  app.get('/institutions/:institutionId/access', ...controller.access);
  app.get('/institutions/:institutionId/roles', ...controller.roles);
  app.get('/institutions/:institutionId/memberships', ...controller.listMembers);
  app.put('/institutions/:institutionId/memberships/:userId', ...controller.updateMembership);
  return app;
}
