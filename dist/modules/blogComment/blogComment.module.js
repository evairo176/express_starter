"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blogCommentController = exports.blogCommentService = void 0;
const blogComment_controller_1 = require("./blogComment.controller");
const blogComment_service_1 = require("./blogComment.service");
const blogCommentService = new blogComment_service_1.BlogCommentService();
exports.blogCommentService = blogCommentService;
const blogCommentController = new blogComment_controller_1.BlogCommentController(blogCommentService);
exports.blogCommentController = blogCommentController;
