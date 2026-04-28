"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blogPostController = exports.blogPostService = void 0;
const blogPost_controller_1 = require("./blogPost.controller");
const blogPost_service_1 = require("./blogPost.service");
const blogPostService = new blogPost_service_1.BlogPostService();
exports.blogPostService = blogPostService;
const blogPostController = new blogPost_controller_1.BlogPostController(blogPostService);
exports.blogPostController = blogPostController;
