import { Router } from 'express';
import { authenticateJWT } from '../../common/strategies/jwt.strategy';
import { analyticsController } from './analytics.module';

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Visit tracking and analytics statistics
 */
const analyticsRoutes = Router();

/**
 * @swagger
 * /analytics/visit:
 *   post:
 *     summary: Record a visit event
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - path
 *             properties:
 *               path:
 *                 type: string
 *     responses:
 *       201:
 *         description: Visit recorded successfully
 *       400:
 *         description: Validation error
 */
analyticsRoutes.post('/visit', analyticsController.recordVisit);

/**
 * @swagger
 * /analytics/summary:
 *   get:
 *     summary: Get analytics summary (total visits, last 30 days, top posts and projects)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics summary
 *       401:
 *         description: Unauthorized
 */
analyticsRoutes.get('/summary', authenticateJWT, analyticsController.summary);

/**
 * @swagger
 * /analytics/aggregations:
 *   get:
 *     summary: Get project counts grouped by category, tag, and tech stack
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aggregated project counts
 *       401:
 *         description: Unauthorized
 */
analyticsRoutes.get(
  '/aggregations',
  authenticateJWT,
  analyticsController.aggregations,
);

export default analyticsRoutes;
