"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_module_1 = require("./auth.module");
const jwt_strategy_1 = require("../../cummon/strategies/jwt.strategy");
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication API
 */
const authRoutes = (0, express_1.Router)();
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request
 */
authRoutes.post('/register', auth_module_1.authController.register);
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 */
authRoutes.post('/login', auth_module_1.authController.login);
/**
 * @swagger
 * /auth/verify/email:
 *   post:
 *     summary: Verify email address
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 */
authRoutes.post('/verify/email', auth_module_1.authController.verifyEmail);
authRoutes.post('/password/forgot', auth_module_1.authController.forgotPassword);
authRoutes.post('/password/reset', auth_module_1.authController.resetPassword);
authRoutes.post('/logout', jwt_strategy_1.authenticateJWT, auth_module_1.authController.logout);
authRoutes.post('/refresh-token', auth_module_1.authController.refreshToken);
exports.default = authRoutes;
