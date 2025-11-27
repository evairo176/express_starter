"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jwt_strategy_1 = require("../../cummon/strategies/jwt.strategy");
const portfolioTag_module_1 = require("./portfolioTag.module");
const portfolioTagRoutes = (0, express_1.Router)();
portfolioTagRoutes.post('/', jwt_strategy_1.authenticateJWT, portfolioTag_module_1.portfolioTagController.create);
portfolioTagRoutes.get('/', jwt_strategy_1.authenticateJWT, portfolioTag_module_1.portfolioTagController.findAll);
exports.default = portfolioTagRoutes;
