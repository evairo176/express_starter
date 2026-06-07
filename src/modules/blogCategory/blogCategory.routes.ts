import { Router } from 'express';
import { authenticateJWT } from '../../common/strategies/jwt.strategy';
import { blogCategoryController } from './blogCategory.module';

/**
 * @swagger
 * tags:
 *   name: BlogCategory
 *   description: Blog Category Management
 */
const blogCategoryRoutes = Router();

/**
 * @swagger
 * /blog-category:
 *   get:
 *     summary: Get all blog categories (public)
 *     tags: [BlogCategory]
 *     responses:
 *       200:
 *         description: List of blog categories
 */
blogCategoryRoutes.get('/', blogCategoryController.findAll);

/**
 * @swagger
 * /blog-category/{id}:
 *   get:
 *     summary: Get blog category by ID
 *     tags: [BlogCategory]
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
blogCategoryRoutes.get('/:id', blogCategoryController.getOne);

/**
 * @swagger
 * /blog-category:
 *   post:
 *     summary: Create a new blog category
 *     tags: [BlogCategory]
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
 *               slug:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created successfully
 */
blogCategoryRoutes.post('/', authenticateJWT, blogCategoryController.create);

/**
 * @swagger
 * /blog-category/{id}:
 *   put:
 *     summary: Update blog category
 *     tags: [BlogCategory]
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
blogCategoryRoutes.put('/:id', authenticateJWT, blogCategoryController.update);

/**
 * @swagger
 * /blog-category/{id}:
 *   delete:
 *     summary: Delete blog category
 *     tags: [BlogCategory]
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
blogCategoryRoutes.delete(
  '/:id',
  authenticateJWT,
  blogCategoryController.destroy,
);

export default blogCategoryRoutes;
