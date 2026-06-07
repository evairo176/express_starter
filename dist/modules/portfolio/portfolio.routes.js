"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jwt_strategy_1 = require("../../common/strategies/jwt.strategy");
const portfolio_module_1 = require("./portfolio.module");
const cache_1 = require("../../middlewares/cache");
/**
 * @swagger
 * tags:
 *   name: Portfolio
 *   description: Portfolio Management
 */
const portfolioRoutes = (0, express_1.Router)();
/**
 * @swagger
 * /portfolio:
 *   post:
 *     summary: Create a new portfolio
 *     tags: [Portfolio]
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
 *               - slug
 *             properties:
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               shortDesc:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               liveUrl:
 *                 type: string
 *               repoUrl:
 *                 type: string
 *               isPublished:
 *                 type: boolean
 *               featured:
 *                 type: boolean
 *               tagIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               techIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     alt:
 *                       type: string
 *                     position:
 *                       type: number
 *     responses:
 *       201:
 *         description: Portfolio created successfully
 */
portfolioRoutes.post('/', jwt_strategy_1.authenticateJWT, portfolio_module_1.portfolioController.create);
/**
 * @swagger
 * /portfolio:
 *   get:
 *     summary: Get all portfolios
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of portfolios
 */
portfolioRoutes.get('/', portfolio_module_1.portfolioController.findAll);
/**
 * @swagger
 * /portfolio/public:
 *   get:
 *     summary: Get published portfolios with filters, search, and pagination
 *     tags: [Portfolio]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: category
 *         description: Category slug
 *         schema:
 *           type: string
 *       - in: query
 *         name: tags
 *         description: CSV of tag slugs (AND semantics)
 *         schema:
 *           type: string
 *       - in: query
 *         name: tech
 *         description: CSV of tech stack names (AND semantics)
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         description: Case-insensitive title/shortDesc search
 *         schema:
 *           type: string
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of published portfolios with pagination metadata
 */
portfolioRoutes.get('/public', (0, cache_1.cacheMiddleware)({ tags: ['portfolio'] }), portfolio_module_1.portfolioController.findPublic);
/**
 * @swagger
 * /portfolio/public/{slug}:
 *   get:
 *     summary: Get a published portfolio by slug
 *     tags: [Portfolio]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Published portfolio detail
 *       404:
 *         description: Portfolio not found or not published
 */
portfolioRoutes.get('/public/:slug', (0, cache_1.cacheMiddleware)({ tags: ['portfolio'] }), portfolio_module_1.portfolioController.findPublicBySlug);
/**
 * @swagger
 * /portfolio/{id}:
 *   get:
 *     summary: Get portfolio by ID
 *     tags: [Portfolio]
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
 *         description: Portfolio details
 *       404:
 *         description: Portfolio not found
 */
portfolioRoutes.get('/:id', jwt_strategy_1.authenticateJWT, portfolio_module_1.portfolioController.getOne);
/**
 * @swagger
 * /portfolio/{id}:
 *   put:
 *     summary: Update portfolio
 *     tags: [Portfolio]
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
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               shortDesc:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               liveUrl:
 *                 type: string
 *               repoUrl:
 *                 type: string
 *               isPublished:
 *                 type: boolean
 *               featured:
 *                 type: boolean
 *               tagIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               techIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     alt:
 *                       type: string
 *                     position:
 *                       type: number
 *     responses:
 *       200:
 *         description: Portfolio updated successfully
 */
portfolioRoutes.put('/:id', jwt_strategy_1.authenticateJWT, portfolio_module_1.portfolioController.update);
/**
 * @swagger
 * /portfolio/{id}:
 *   delete:
 *     summary: Delete portfolio
 *     tags: [Portfolio]
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
 *         description: Portfolio deleted successfully
 */
portfolioRoutes.delete('/:id', jwt_strategy_1.authenticateJWT, portfolio_module_1.portfolioController.destroy);
exports.default = portfolioRoutes;
