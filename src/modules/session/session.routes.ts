import { Router } from 'express';
import { sessionController } from './session.module';
import { authenticateJWT } from '../../cummon/strategies/jwt.strategy';

/**
 * @swagger
 * tags:
 *   name: Session
 *   description: Session management
 */
const sessionRoutes = Router();

/**
 * @swagger
 * /session/me/all:
 *   get:
 *     summary: Get all active sessions for current user
 *     tags: [Session]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   userAgent:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 */
sessionRoutes.get(
  '/me/all',
  authenticateJWT,
  sessionController.getSessionByUser,
);

/**
 * @swagger
 * /session:
 *   get:
 *     summary: Get current session details
 *     tags: [Session]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current session details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 userId:
 *                   type: string
 */
sessionRoutes.get('/', authenticateJWT, sessionController.getSession);

/**
 * @swagger
 * /session/revoke/{id}:
 *   post:
 *     summary: Revoke a specific session
 *     tags: [Session]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID to revoke
 *     responses:
 *       200:
 *         description: Session revoked successfully
 *       404:
 *         description: Session not found
 */
sessionRoutes.post('/revoke/:id', sessionController.revokeSession);

export default sessionRoutes;
