"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jwt_strategy_1 = require("../../cummon/strategies/jwt.strategy");
const techStack_module_1 = require("./techStack.module");
/**
 * @swagger
 * tags:
 *   name: TechStack
 *   description: Tech Stack Management
 */
const techStackRoutes = (0, express_1.Router)();
/**
 * @swagger
 * /tech-stack:
 *   post:
 *     summary: Create a new tech stack
 *     tags: [TechStack]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tech stack created successfully
 */
techStackRoutes.post('/', jwt_strategy_1.authenticateJWT, techStack_module_1.techStackController.create);
/**
 * @swagger
 * /tech-stack:
 *   get:
 *     summary: Get all tech stacks
 *     tags: [TechStack]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tech stacks
 */
techStackRoutes.get('/', jwt_strategy_1.authenticateJWT, techStack_module_1.techStackController.findAll);
/**
 * @swagger
 * /tech-stack/{id}:
 *   get:
 *     summary: Get tech stack by ID
 *     tags: [TechStack]
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
 *         description: Tech stack details
 *       404:
 *         description: Tech stack not found
 */
techStackRoutes.get('/:id', jwt_strategy_1.authenticateJWT, techStack_module_1.techStackController.getOne);
/**
 * @swagger
 * /tech-stack/{id}:
 *   put:
 *     summary: Update tech stack
 *     tags: [TechStack]
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
 *               name:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tech stack updated successfully
 */
techStackRoutes.put('/:id', jwt_strategy_1.authenticateJWT, techStack_module_1.techStackController.update);
/**
 * @swagger
 * /tech-stack/{id}:
 *   delete:
 *     summary: Delete tech stack
 *     tags: [TechStack]
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
 *         description: Tech stack deleted successfully
 */
techStackRoutes.delete('/:id', jwt_strategy_1.authenticateJWT, techStack_module_1.techStackController.destroy);
exports.default = techStackRoutes;
