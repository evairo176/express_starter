import { Router } from 'express';
import { authenticateJWT } from '../../cummon/strategies/jwt.strategy';
import { techStackController } from './techStack.module';

const techStackRoutes = Router();

techStackRoutes.post('/', authenticateJWT, techStackController.create);

techStackRoutes.get('/', authenticateJWT, techStackController.findAll);

export default techStackRoutes;
