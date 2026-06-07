"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsController = exports.analyticsService = void 0;
const analytics_controller_1 = require("./analytics.controller");
const analytics_service_1 = require("./analytics.service");
const analyticsService = new analytics_service_1.AnalyticsService();
exports.analyticsService = analyticsService;
const analyticsController = new analytics_controller_1.AnalyticsController(analyticsService);
exports.analyticsController = analyticsController;
