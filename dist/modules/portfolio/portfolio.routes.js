"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jwt_strategy_1 = require("../../cummon/strategies/jwt.strategy");
const portfolio_module_1 = require("./portfolio.module");
const portfolioRoutes = (0, express_1.Router)();
portfolioRoutes.post('/', jwt_strategy_1.authenticateJWT, portfolio_module_1.portfolioController.create);
portfolioRoutes.get('/', jwt_strategy_1.authenticateJWT, portfolio_module_1.portfolioController.findAll);
exports.default = portfolioRoutes;
