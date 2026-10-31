import { Hono } from 'hono';
import { requireSession, type ApiVariables, type SessionAuth } from '../middleware/auth.js';
import type { AdmissionsService } from '../services/admissions/admissions.service.js';
import { createAdmissionsController } from '../controllers/admissions.controller.js';

export function createAdmissionsRoutes(auth: SessionAuth, admissions: AdmissionsService) {
  const app = new Hono<{ Variables: ApiVariables }>();
  const controller = createAdmissionsController(admissions);
  app.use('*', requireSession(auth));
  app.get('/setup', ...controller.setup);
  app.put('/settings', ...controller.updateSettings);
  app.post('/offerings', ...controller.addOffering);
  app.get('/candidates', ...controller.listCandidates);
  app.post('/candidates', ...controller.createCandidate);
  app.get('/candidates/:candidateId', ...controller.candidate);
  app.post('/candidates/:candidateId/actions', ...controller.candidateAction);
  app.get('/notifications', ...controller.notifications);
  app.put('/notifications/:notificationId/read', ...controller.readNotification);
  app.post(
    '/candidates/:candidateId/monthly-charges/:chargeId/collect',
    ...controller.collectMonthlyFee,
  );
  app.post(
    '/candidates/:candidateId/monthly-schedules/:scheduleId/stop',
    ...controller.stopMonthlyFee,
  );
  return app;
}
