import { Router } from 'express';
import { authenticateJWT } from '../../common/strategies/jwt.strategy';
import { blogTagController } from './blogTag.module';

/**
 * @swagger
 * tags:
 *   name: BlogTag
 *   description: Blog Tag Management
 */
const blogTagRoutes = Router();

/**
 * @swagger
 * /blog-tag:
 *   get:
 *     summary: Get all blog tags (public)
 *     tags: [BlogTag]
 *     responses:
 *       200:
 *         description: List of blog tags
 */
blogTagRoutes.get('/', blogTagController.findAll);

/**
 * @swagger
 * /blog-tag/{id}:
 *   get:
 *     summary: Get blog tag by ID
 *     tags: [BlogTag]
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
blogTagRoutes.get('/:id', blogTagController.getOne);

/**
 * @swagger
 * /blog-tag:
 *   post:
 *     summary: Create a new blog tag
 *     tags: [BlogTag]
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
 *         description: Tag created successfully
 */
blogTagRoutes.post('/', authenticateJWT, blogTagController.create);

/**
 * @swagger
 * /blog-tag/{id}:
 *   put:
 *     summary: Update blog tag
 *     tags: [BlogTag]
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
blogTagRoutes.put('/:id', authenticateJWT, blogTagController.update);

/**
 * @swagger
 * /blog-tag/{id}:
 *   delete:
 *     summary: Delete blog tag
 *     tags: [BlogTag]
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
blogTagRoutes.delete('/:id', authenticateJWT, blogTagController.destroy);

export default blogTagRoutes;
