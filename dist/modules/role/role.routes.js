"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jwt_strategy_1 = require("../../cummon/strategies/jwt.strategy");
const role_module_1 = require("./role.module");
const roleRoutes = (0, express_1.Router)();
roleRoutes.get('/', jwt_strategy_1.authenticateJWT, role_module_1.roleController.findAll);
roleRoutes.get('/:roleCode', jwt_strategy_1.authenticateJWT, role_module_1.roleController.findOne);
exports.default = roleRoutes;
