"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.portfolioCategoryController = exports.portfolioCategoryService = void 0;
const portfolioCategory_controller_1 = require("./portfolioCategory.controller");
const portfolioCategory_service_1 = require("./portfolioCategory.service");
const portfolioCategoryService = new portfolioCategory_service_1.PortfolioCategoryService();
exports.portfolioCategoryService = portfolioCategoryService;
const portfolioCategoryController = new portfolioCategory_controller_1.PortfolioCategoryController(portfolioCategoryService);
exports.portfolioCategoryController = portfolioCategoryController;
