import { Router } from 'express';
import { authenticateJWT } from '../../cummon/strategies/jwt.strategy';
import { techStackController } from './techStack.module';

/**
 * @swagger
 * tags:
 *   name: TechStack
 *   description: Tech Stack Management
 */
const techStackRoutes = Router();

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
techStackRoutes.post('/', authenticateJWT, techStackController.create);

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
techStackRoutes.get('/', authenticateJWT, techStackController.findAll);

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
techStackRoutes.get('/:id', authenticateJWT, techStackController.getOne);

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
techStackRoutes.put('/:id', authenticateJWT, techStackController.update);

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
techStackRoutes.delete('/:id', authenticateJWT, techStackController.destroy);

export default techStackRoutes;
