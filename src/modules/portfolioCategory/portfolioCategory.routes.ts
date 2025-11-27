import { Router } from 'express';
import { authenticateJWT } from '../../cummon/strategies/jwt.strategy';
import { portfolioCategoryController } from './portfolioCategory.module';

const portfolioCategoryRoutes = Router();

portfolioCategoryRoutes.post(
  '/',
  authenticateJWT,
  portfolioCategoryController.create,
);

portfolioCategoryRoutes.get(
  '/',
  authenticateJWT,
  portfolioCategoryController.findAll,
);

export default portfolioCategoryRoutes;
