"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blogReactionController = exports.blogReactionService = void 0;
const blogReaction_controller_1 = require("./blogReaction.controller");
const blogReaction_service_1 = require("./blogReaction.service");
const blogReactionService = new blogReaction_service_1.BlogReactionService();
exports.blogReactionService = blogReactionService;
const blogReactionController = new blogReaction_controller_1.BlogReactionController(blogReactionService);
exports.blogReactionController = blogReactionController;
