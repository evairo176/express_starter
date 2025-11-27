import { Router } from 'express';
import { authenticateJWT } from '../../cummon/strategies/jwt.strategy';
import { portfolioController } from './portfolio.module';

const portfolioRoutes = Router();

portfolioRoutes.post('/', authenticateJWT, portfolioController.create);
portfolioRoutes.get('/', authenticateJWT, portfolioController.findAll);

export default portfolioRoutes;
