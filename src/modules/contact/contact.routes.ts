import { Router } from 'express';
import { authenticateJWT } from '../../common/strategies/jwt.strategy';
import { writeLimiter } from '../../middlewares/rate-limit';
import { contactController } from './contact.module';

const contactRoutes = Router();

// Public: submit a contact message (rate-limited write, Req 12.2).
contactRoutes.post('/', writeLimiter, contactController.create);

// Admin: list contact messages newest-first with pagination.
contactRoutes.use(authenticateJWT);
contactRoutes.get('/', contactController.findAll);

export default contactRoutes;
