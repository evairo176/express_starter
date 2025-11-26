import { MfaService } from '../mfa/mfa.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const authService = new AuthService();
const mfaService = new MfaService();
const authController = new AuthController(authService, mfaService);

export { authService, authController };
