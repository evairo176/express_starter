import { Router } from 'express';
import { authenticateJWT } from '../../cummon/strategies/jwt.strategy';
import { portfolioController } from './portfolio.module';

/**
 * @swagger
 * tags:
 *   name: Portfolio
 *   description: Portfolio Management
 */
const portfolioRoutes = Router();

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
portfolioRoutes.post('/', authenticateJWT, portfolioController.create);
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
portfolioRoutes.get('/', portfolioController.findAll);

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
portfolioRoutes.get('/:id', authenticateJWT, portfolioController.getOne);

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
portfolioRoutes.put('/:id', authenticateJWT, portfolioController.update);

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
portfolioRoutes.delete('/:id', authenticateJWT, portfolioController.destroy);

export default portfolioRoutes;
