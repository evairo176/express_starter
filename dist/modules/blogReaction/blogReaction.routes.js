"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rate_limit_1 = require("../../middlewares/rate-limit");
const blogReaction_module_1 = require("./blogReaction.module");
const blogReactionRoutes = (0, express_1.Router)();
// Public: add a reaction to a post resolved by slug (Req 5.1, 5.2, 5.3).
// Rate-limited write endpoint (Req 12.2).
blogReactionRoutes.post('/public/:slug/reactions', rate_limit_1.writeLimiter, blogReaction_module_1.blogReactionController.create);
exports.default = blogReactionRoutes;
