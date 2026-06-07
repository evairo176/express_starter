"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jwt_strategy_1 = require("../../common/strategies/jwt.strategy");
const testimonial_module_1 = require("./testimonial.module");
/**
 * @swagger
 * tags:
 *   name: Testimonial
 *   description: Testimonial Management
 */
const testimonialRoutes = (0, express_1.Router)();
/**
 * @swagger
 * /testimonial:
 *   post:
 *     summary: Create a new testimonial
 *     tags: [Testimonial]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - authorName
 *               - authorRole
 *               - quote
 *             properties:
 *               authorName:
 *                 type: string
 *               authorRole:
 *                 type: string
 *               quote:
 *                 type: string
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Testimonial created successfully
 *       400:
 *         description: Validation error
 */
testimonialRoutes.post('/', jwt_strategy_1.authenticateJWT, testimonial_module_1.testimonialController.create);
/**
 * @swagger
 * /testimonial/public:
 *   get:
 *     summary: Get all published testimonials
 *     tags: [Testimonial]
 *     responses:
 *       200:
 *         description: List of published testimonials
 */
testimonialRoutes.get('/public', testimonial_module_1.testimonialController.findPublished);
/**
 * @swagger
 * /testimonial/{id}/publish:
 *   patch:
 *     summary: Update the published state of a testimonial
 *     tags: [Testimonial]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Testimonial published state updated successfully
 *       404:
 *         description: Testimonial not found
 */
testimonialRoutes.patch('/:id/publish', jwt_strategy_1.authenticateJWT, testimonial_module_1.testimonialController.publish);
exports.default = testimonialRoutes;
