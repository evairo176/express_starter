"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jwt_strategy_1 = require("../../common/strategies/jwt.strategy");
const blogTag_module_1 = require("./blogTag.module");
/**
 * @swagger
 * tags:
 *   name: BlogTag
 *   description: Blog Tag Management
 */
const blogTagRoutes = (0, express_1.Router)();
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
blogTagRoutes.get('/', blogTag_module_1.blogTagController.findAll);
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
blogTagRoutes.get('/:id', blogTag_module_1.blogTagController.getOne);
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
blogTagRoutes.post('/', jwt_strategy_1.authenticateJWT, blogTag_module_1.blogTagController.create);
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
blogTagRoutes.put('/:id', jwt_strategy_1.authenticateJWT, blogTag_module_1.blogTagController.update);
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
blogTagRoutes.delete('/:id', jwt_strategy_1.authenticateJWT, blogTag_module_1.blogTagController.destroy);
exports.default = blogTagRoutes;
