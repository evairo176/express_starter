import { Router } from 'express';
import { authenticateJWT } from '../../cummon/strategies/jwt.strategy';
import { mfaController } from './mfa.module';

const mfaRoutes = Router();

mfaRoutes.get('/setup', authenticateJWT, mfaController.generateMFASetup);
mfaRoutes.post('/verify', authenticateJWT, mfaController.verifyMFASetup);
mfaRoutes.put('/revoke', authenticateJWT, mfaController.revokeMFASetup);

mfaRoutes.post('/verify-login', mfaController.verifyMFAForLogin);

export default mfaRoutes;
