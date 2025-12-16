"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jwt_strategy_1 = require("../../cummon/strategies/jwt.strategy");
const dashboard_controller_1 = require("./dashboard.controller");
const dashboardRoutes = (0, express_1.Router)();
dashboardRoutes.get('/analytics', jwt_strategy_1.authenticateJWT, dashboard_controller_1.DashboardController.getAnalytics);
exports.default = dashboardRoutes;
