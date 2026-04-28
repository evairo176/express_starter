"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jwt_strategy_1 = require("../../cummon/strategies/jwt.strategy");
const dashboard_module_1 = require("./dashboard.module");
const dashboardRoutes = (0, express_1.Router)();
dashboardRoutes.get('/analytics', jwt_strategy_1.authenticateJWT, dashboard_module_1.dashboardController.getAnalytics);
// router.get("/summary", async (_req, res) => {
//   const data = await dashboard.getTicketSummary()
//   res.json(data)
// })
// router.get("/category", async (_req, res) => {
//   const data = await dashboard.getCategoryStats()
//   res.json(data)
// })
// router.get("/pic-performance", async (_req, res) => {
//   const data = await dashboard.getPicPerformance()
//   res.json(data)
// })
exports.default = dashboardRoutes;
