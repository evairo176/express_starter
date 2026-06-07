import { Router } from 'express';
import { writeLimiter } from '../../middlewares/rate-limit';
import { newsletterController } from './newsletter.module';

/**
 * @swagger
 * tags:
 *   name: Newsletter
 *   description: Newsletter subscription management
 */
const newsletterRoutes = Router();

/**
 * @swagger
 * /newsletter/subscribe:
 *   post:
 *     summary: Subscribe to the newsletter
 *     tags: [Newsletter]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Subscribed successfully (idempotent)
 *       400:
 *         description: Invalid email format
 */
newsletterRoutes.post(
  '/subscribe',
  writeLimiter,
  newsletterController.subscribe,
);

/**
 * @swagger
 * /newsletter/unsubscribe:
 *   get:
 *     summary: Unsubscribe from the newsletter using a token
 *     tags: [Newsletter]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unsubscribed successfully
 */
newsletterRoutes.get('/unsubscribe', newsletterController.unsubscribe);

export default newsletterRoutes;
