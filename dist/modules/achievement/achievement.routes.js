"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jwt_strategy_1 = require("../../common/strategies/jwt.strategy");
const achievement_module_1 = require("./achievement.module");
/**
 * @swagger
 * tags:
 *   name: Achievement
 *   description: Achievement Management (awards / certifications / milestones)
 */
const achievementRoutes = (0, express_1.Router)();
/**
 * @swagger
 * /achievements/public:
 *   get:
 *     summary: Get all published achievements (ordered by position, then date)
 *     tags: [Achievement]
 *     responses:
 *       200:
 *         description: List of published achievements
 */
achievementRoutes.get('/public', achievement_module_1.achievementController.publicList);
/**
 * @swagger
 * /achievements:
 *   get:
 *     summary: Get all achievements (admin)
 *     tags: [Achievement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of achievements
 */
achievementRoutes.get('/', jwt_strategy_1.authenticateJWT, achievement_module_1.achievementController.list);
/**
 * @swagger
 * /achievements:
 *   post:
 *     summary: Create a new achievement
 *     tags: [Achievement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - date
 *             properties:
 *               title:
 *                 type: string
 *               issuer:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               url:
 *                 type: string
 *               icon:
 *                 type: string
 *               category:
 *                 type: string
 *               position:
 *                 type: integer
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Achievement created successfully
 *       400:
 *         description: Validation error
 */
achievementRoutes.post('/', jwt_strategy_1.authenticateJWT, achievement_module_1.achievementController.create);
/**
 * @swagger
 * /achievements/{id}:
 *   put:
 *     summary: Update an achievement
 *     tags: [Achievement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               issuer:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               url:
 *                 type: string
 *               icon:
 *                 type: string
 *               category:
 *                 type: string
 *               position:
 *                 type: integer
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Achievement updated successfully
 *       404:
 *         description: Achievement not found
 */
achievementRoutes.put('/:id', jwt_strategy_1.authenticateJWT, achievement_module_1.achievementController.update);
/**
 * @swagger
 * /achievements/{id}:
 *   delete:
 *     summary: Delete an achievement
 *     tags: [Achievement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Achievement deleted successfully
 *       404:
 *         description: Achievement not found
 */
achievementRoutes.delete('/:id', jwt_strategy_1.authenticateJWT, achievement_module_1.achievementController.destroy);
exports.default = achievementRoutes;
