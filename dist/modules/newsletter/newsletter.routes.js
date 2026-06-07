"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rate_limit_1 = require("../../middlewares/rate-limit");
const newsletter_module_1 = require("./newsletter.module");
/**
 * @swagger
 * tags:
 *   name: Newsletter
 *   description: Newsletter subscription management
 */
const newsletterRoutes = (0, express_1.Router)();
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
newsletterRoutes.post('/subscribe', rate_limit_1.writeLimiter, newsletter_module_1.newsletterController.subscribe);
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
newsletterRoutes.get('/unsubscribe', newsletter_module_1.newsletterController.unsubscribe);
exports.default = newsletterRoutes;
