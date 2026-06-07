"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jwt_strategy_1 = require("../../common/strategies/jwt.strategy");
const rate_limit_1 = require("../../middlewares/rate-limit");
const blogComment_module_1 = require("./blogComment.module");
/**
 * @swagger
 * tags:
 *   name: BlogComments
 *   description: Blog post comments (public submit/list + admin moderation)
 */
/**
 * Router for blog comment endpoints. Intended to be mounted under
 * `/blog-posts` (registration happens in task 17.1), producing:
 *   - GET  /blog-posts/public/:slug/comments
 *   - POST /blog-posts/public/:slug/comments
 *   - GET  /blog-posts/comments                (admin)
 *   - GET  /blog-posts/comments/count          (admin)
 *   - POST /blog-posts/comments/:id/approve    (admin)
 *   - DELETE /blog-posts/comments/:id          (admin)
 */
const blogCommentRoutes = (0, express_1.Router)();
/**
 * @swagger
 * /blog-posts/public/{slug}/comments:
 *   get:
 *     summary: List approved comments for a published post (newest first)
 *     tags: [BlogComments]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Approved comments returned successfully
 *       404:
 *         description: Blog post not found
 */
blogCommentRoutes.get('/public/:slug/comments', blogComment_module_1.blogCommentController.listApproved);
/**
 * @swagger
 * /blog-posts/public/{slug}/comments:
 *   post:
 *     summary: Submit a comment on a published post
 *     tags: [BlogComments]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - body
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               body:
 *                 type: string
 *                 maxLength: 2000
 *     responses:
 *       201:
 *         description: Comment submitted successfully
 *       400:
 *         description: Invalid name, email, or body
 *       404:
 *         description: Blog post not found
 *       429:
 *         description: Too many requests
 */
blogCommentRoutes.post('/public/:slug/comments', rate_limit_1.writeLimiter, blogComment_module_1.blogCommentController.create);
// Admin moderation endpoints (per-route auth so this router can be safely
// mounted alongside the blogPost router at the same /blog-posts base path
// without its auth guard shadowing sibling public routes).
/**
 * @swagger
 * /blog-posts/comments:
 *   get:
 *     summary: List all comments including pending (admin, newest first)
 *     tags: [BlogComments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, all]
 *           default: all
 *     responses:
 *       200:
 *         description: Comments returned successfully
 */
blogCommentRoutes.get('/comments', jwt_strategy_1.authenticateJWT, blogComment_module_1.blogCommentController.listAll);
/**
 * @swagger
 * /blog-posts/comments/count:
 *   get:
 *     summary: Pending/approved/total comment counts (admin)
 *     tags: [BlogComments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comment counts returned successfully
 */
blogCommentRoutes.get('/comments/count', jwt_strategy_1.authenticateJWT, blogComment_module_1.blogCommentController.count);
/**
 * @swagger
 * /blog-posts/comments/{id}/approve:
 *   post:
 *     summary: Approve a comment (admin)
 *     tags: [BlogComments]
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
 *         description: Comment approved successfully
 */
blogCommentRoutes.post('/comments/:id/approve', jwt_strategy_1.authenticateJWT, blogComment_module_1.blogCommentController.approve);
/**
 * @swagger
 * /blog-posts/comments/{id}:
 *   delete:
 *     summary: Delete a comment (admin)
 *     tags: [BlogComments]
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
 *         description: Comment deleted successfully
 */
blogCommentRoutes.delete('/comments/:id', jwt_strategy_1.authenticateJWT, blogComment_module_1.blogCommentController.destroy);
exports.default = blogCommentRoutes;
