"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jwt_strategy_1 = require("../../common/strategies/jwt.strategy");
const analytics_module_1 = require("./analytics.module");
/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Visit tracking and analytics statistics
 */
const analyticsRoutes = (0, express_1.Router)();
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
analyticsRoutes.post('/visit', analytics_module_1.analyticsController.recordVisit);
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
analyticsRoutes.get('/summary', jwt_strategy_1.authenticateJWT, analytics_module_1.analyticsController.summary);
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
analyticsRoutes.get('/aggregations', jwt_strategy_1.authenticateJWT, analytics_module_1.analyticsController.aggregations);
exports.default = analyticsRoutes;
