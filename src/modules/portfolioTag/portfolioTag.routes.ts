import { Router } from 'express';
import { authenticateJWT } from '../../cummon/strategies/jwt.strategy';
import { portfolioTagController } from './portfolioTag.module';

const portfolioTagRoutes = Router();

portfolioTagRoutes.post('/', authenticateJWT, portfolioTagController.create);

portfolioTagRoutes.get('/', authenticateJWT, portfolioTagController.findAll);

export default portfolioTagRoutes;
