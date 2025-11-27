"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jwt_strategy_1 = require("../../cummon/strategies/jwt.strategy");
const techStack_module_1 = require("./techStack.module");
const techStackRoutes = (0, express_1.Router)();
techStackRoutes.post('/', jwt_strategy_1.authenticateJWT, techStack_module_1.techStackController.create);
techStackRoutes.get('/', jwt_strategy_1.authenticateJWT, techStack_module_1.techStackController.findAll);
exports.default = techStackRoutes;
