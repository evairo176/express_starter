import { Router } from 'express';
import { authenticateJWT } from '../../cummon/strategies/jwt.strategy';
import { DashboardController } from './dashboard.controller';

const dashboardRoutes = Router();

dashboardRoutes.get(
  '/analytics',
  authenticateJWT,
  DashboardController.getAnalytics,
);

export default dashboardRoutes;
