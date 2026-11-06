import { Hono } from 'hono';
import { requireSession, type ApiVariables, type SessionAuth } from '../../middleware/auth.js';
import type { SchoolService } from '../../services/school/school.service.js';
import { createSchoolController } from '../../controllers/school.controller.js';

export function createSchoolRoutes(auth: SessionAuth, service: SchoolService) {
  const app = new Hono<{ Variables: ApiVariables }>();
  const controller = createSchoolController(service);
  app.use('*', requireSession(auth));
  app.get('/', ...controller.snapshot);
  app.get('/enrollments/:enrollmentId/history', ...controller.enrollmentHistory);
  app.post('/commands', ...controller.command);
  app.post('/evidence', ...controller.uploadEvidence);
  app.get('/evidence/:evidenceId', ...controller.evidence);
  return app;
}
