"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jwt_strategy_1 = require("../../cummon/strategies/jwt.strategy");
const portfolioCategory_module_1 = require("./portfolioCategory.module");
const portfolioCategoryRoutes = (0, express_1.Router)();
portfolioCategoryRoutes.post('/', jwt_strategy_1.authenticateJWT, portfolioCategory_module_1.portfolioCategoryController.create);
portfolioCategoryRoutes.get('/', jwt_strategy_1.authenticateJWT, portfolioCategory_module_1.portfolioCategoryController.findAll);
exports.default = portfolioCategoryRoutes;
