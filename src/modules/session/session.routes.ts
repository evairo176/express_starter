import { Router } from 'express';
import { sessionController } from './session.module';
import { authenticateJWT } from '../../cummon/strategies/jwt.strategy';

const sessionRoutes = Router();

sessionRoutes.get(
  '/me/all',
  authenticateJWT,
  sessionController.getSessionByUser,
);
sessionRoutes.get('/', authenticateJWT, sessionController.getSession);

sessionRoutes.post('/revoke/:id', sessionController.revokeSession);

export default sessionRoutes;
