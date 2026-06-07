"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jwt_strategy_1 = require("../../common/strategies/jwt.strategy");
const dashboard_module_1 = require("./dashboard.module");
const dashboardRoutes = (0, express_1.Router)();
// All dashboard management endpoints require authentication.
// Unauthenticated requests are rejected with a 401 (Req 10.3).
dashboardRoutes.use(jwt_strategy_1.authenticateJWT);
dashboardRoutes.get('/analytics', dashboard_module_1.dashboardController.getAnalytics);
// Portfolio project admin CRUD + admin list + publish toggle (Req 10.1, 10.4, 10.6).
dashboardRoutes.get('/projects', dashboard_module_1.dashboardController.listProjects);
dashboardRoutes.post('/projects', dashboard_module_1.dashboardController.createProject);
dashboardRoutes.get('/projects/:id', dashboard_module_1.dashboardController.getProject);
dashboardRoutes.put('/projects/:id', dashboard_module_1.dashboardController.updateProject);
dashboardRoutes.delete('/projects/:id', dashboard_module_1.dashboardController.deleteProject);
dashboardRoutes.patch('/projects/:id/publish', dashboard_module_1.dashboardController.toggleProjectPublished);
// Blog post admin CRUD + admin list + publish toggle (Req 10.2, 10.5, 10.6).
dashboardRoutes.get('/posts', dashboard_module_1.dashboardController.listPosts);
dashboardRoutes.post('/posts', dashboard_module_1.dashboardController.createPost);
dashboardRoutes.get('/posts/:id', dashboard_module_1.dashboardController.getPost);
dashboardRoutes.put('/posts/:id', dashboard_module_1.dashboardController.updatePost);
dashboardRoutes.delete('/posts/:id', dashboard_module_1.dashboardController.deletePost);
dashboardRoutes.patch('/posts/:id/publish', dashboard_module_1.dashboardController.togglePostPublished);
exports.default = dashboardRoutes;
