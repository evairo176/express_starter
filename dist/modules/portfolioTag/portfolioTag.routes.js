"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jwt_strategy_1 = require("../../cummon/strategies/jwt.strategy");
const portfolioTag_module_1 = require("./portfolioTag.module");
/**
 * @swagger
 * tags:
 *   name: PortfolioTag
 *   description: Portfolio Tag Management
 */
const portfolioTagRoutes = (0, express_1.Router)();
/**
 * @swagger
 * /portfolio-tag:
 *   post:
 *     summary: Create a new tag
 *     tags: [PortfolioTag]
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
 *               - slug
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tag created successfully
 */
portfolioTagRoutes.post('/', jwt_strategy_1.authenticateJWT, portfolioTag_module_1.portfolioTagController.create);
/**
 * @swagger
 * /portfolio-tag:
 *   get:
 *     summary: Get all tags
 *     tags: [PortfolioTag]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tags
 */
portfolioTagRoutes.get('/', jwt_strategy_1.authenticateJWT, portfolioTag_module_1.portfolioTagController.findAll);
/**
 * @swagger
 * /portfolio-tag/{id}:
 *   get:
 *     summary: Get tag by ID
 *     tags: [PortfolioTag]
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
 *         description: Tag details
 *       404:
 *         description: Tag not found
 */
portfolioTagRoutes.get('/:id', jwt_strategy_1.authenticateJWT, portfolioTag_module_1.portfolioTagController.getOne);
/**
 * @swagger
 * /portfolio-tag/{id}:
 *   put:
 *     summary: Update tag
 *     tags: [PortfolioTag]
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
 *               slug:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tag updated successfully
 */
portfolioTagRoutes.put('/:id', jwt_strategy_1.authenticateJWT, portfolioTag_module_1.portfolioTagController.update);
/**
 * @swagger
 * /portfolio-tag/{id}:
 *   delete:
 *     summary: Delete tag
 *     tags: [PortfolioTag]
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
 *         description: Tag deleted successfully
 */
portfolioTagRoutes.delete('/:id', jwt_strategy_1.authenticateJWT, portfolioTag_module_1.portfolioTagController.destroy);
exports.default = portfolioTagRoutes;
