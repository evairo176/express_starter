import { Router } from 'express';
import { authenticateJWT } from '../../cummon/strategies/jwt.strategy';
import { portfolioCategoryController } from './portfolioCategory.module';

/**
 * @swagger
 * tags:
 *   name: PortfolioCategory
 *   description: Portfolio Category Management
 */
const portfolioCategoryRoutes = Router();

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
portfolioCategoryRoutes.post(
  '/',
  authenticateJWT,
  portfolioCategoryController.create,
);

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
portfolioCategoryRoutes.get(
  '/',
  authenticateJWT,
  portfolioCategoryController.findAll,
);

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
portfolioCategoryRoutes.get(
  '/:id',
  authenticateJWT,
  portfolioCategoryController.getOne,
);

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
portfolioCategoryRoutes.put(
  '/:id',
  authenticateJWT,
  portfolioCategoryController.update,
);

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
portfolioCategoryRoutes.delete(
  '/:id',
  authenticateJWT,
  portfolioCategoryController.destroy,
);

export default portfolioCategoryRoutes;
