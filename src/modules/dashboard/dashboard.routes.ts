import { Router } from 'express';
import { authenticateJWT } from '../../cummon/strategies/jwt.strategy';
import { dashboardController } from './dashboard.module';

const dashboardRoutes = Router();

dashboardRoutes.get(
  '/analytics',
  authenticateJWT,
  dashboardController.getAnalytics,
);

// router.get("/summary", async (_req, res) => {
//   const data = await dashboard.getTicketSummary()
//   res.json(data)
// })

// router.get("/category", async (_req, res) => {
//   const data = await dashboard.getCategoryStats()
//   res.json(data)
// })

// router.get("/pic-performance", async (_req, res) => {
//   const data = await dashboard.getPicPerformance()
//   res.json(data)
// })

export default dashboardRoutes;
