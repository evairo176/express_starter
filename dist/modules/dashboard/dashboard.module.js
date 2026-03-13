"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardController = exports.dashboardService = void 0;
const dashboard_controller_1 = require("./dashboard.controller");
const dashboard_service_1 = require("./dashboard.service");
const dashboardService = new dashboard_service_1.DashboardService();
exports.dashboardService = dashboardService;
const dashboardController = new dashboard_controller_1.DashboardController(dashboardService);
exports.dashboardController = dashboardController;
