"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardModule = void 0;
const dashboard_controller_1 = require("./dashboard.controller");
const dashboard_service_1 = require("./dashboard.service");
exports.dashboardModule = {
    controller: dashboard_controller_1.DashboardController,
    service: dashboard_service_1.DashboardService,
};
