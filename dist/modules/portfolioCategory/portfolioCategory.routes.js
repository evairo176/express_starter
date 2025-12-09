"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jwt_strategy_1 = require("../../cummon/strategies/jwt.strategy");
const portfolioCategory_module_1 = require("./portfolioCategory.module");
/**
 * @swagger
 * tags:
 *   name: PortfolioCategory
 *   description: Portfolio Category Management
 */
const portfolioCategoryRoutes = (0, express_1.Router)();
/**
 * @swagger
 * /portfolio-category:
 *   post:
 *     summary: Create a new category
 *     tags: [PortfolioCategory]
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
 *         description: Category created successfully
 */
portfolioCategoryRoutes.post('/', jwt_strategy_1.authenticateJWT, portfolioCategory_module_1.portfolioCategoryController.create);
/**
 * @swagger
 * /portfolio-category:
 *   get:
 *     summary: Get all categories
 *     tags: [PortfolioCategory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 */
portfolioCategoryRoutes.get('/', jwt_strategy_1.authenticateJWT, portfolioCategory_module_1.portfolioCategoryController.findAll);
/**
 * @swagger
 * /portfolio-category/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [PortfolioCategory]
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
 *         description: Category details
 *       404:
 *         description: Category not found
 */
portfolioCategoryRoutes.get('/:id', jwt_strategy_1.authenticateJWT, portfolioCategory_module_1.portfolioCategoryController.getOne);
/**
 * @swagger
 * /portfolio-category/{id}:
 *   put:
 *     summary: Update category
 *     tags: [PortfolioCategory]
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
 *         description: Category updated successfully
 */
portfolioCategoryRoutes.put('/:id', jwt_strategy_1.authenticateJWT, portfolioCategory_module_1.portfolioCategoryController.update);
/**
 * @swagger
 * /portfolio-category/{id}:
 *   delete:
 *     summary: Delete category
 *     tags: [PortfolioCategory]
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
 *         description: Category deleted successfully
 */
portfolioCategoryRoutes.delete('/:id', jwt_strategy_1.authenticateJWT, portfolioCategory_module_1.portfolioCategoryController.destroy);
exports.default = portfolioCategoryRoutes;
