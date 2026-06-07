"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jwt_strategy_1 = require("../../common/strategies/jwt.strategy");
const rate_limit_1 = require("../../middlewares/rate-limit");
const contact_module_1 = require("./contact.module");
const contactRoutes = (0, express_1.Router)();
// Public: submit a contact message (rate-limited write, Req 12.2).
contactRoutes.post('/', rate_limit_1.writeLimiter, contact_module_1.contactController.create);
// Admin: list contact messages newest-first with pagination.
contactRoutes.use(jwt_strategy_1.authenticateJWT);
contactRoutes.get('/', contact_module_1.contactController.findAll);
exports.default = contactRoutes;
