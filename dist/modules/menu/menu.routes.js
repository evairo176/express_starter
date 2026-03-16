"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jwt_strategy_1 = require("../../cummon/strategies/jwt.strategy");
const menu_module_1 = require("./menu.module");
const menuRoutes = (0, express_1.Router)();
menuRoutes.get('/', jwt_strategy_1.authenticateJWT, menu_module_1.menuController.findAll);
menuRoutes.get('/', jwt_strategy_1.authenticateJWT, menu_module_1.menuController.findAll);
exports.default = menuRoutes;
