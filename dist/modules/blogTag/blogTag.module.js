"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blogTagController = exports.blogTagService = void 0;
const blogTag_controller_1 = require("./blogTag.controller");
const blogTag_service_1 = require("./blogTag.service");
const blogTagService = new blogTag_service_1.BlogTagService();
exports.blogTagService = blogTagService;
const blogTagController = new blogTag_controller_1.BlogTagController(blogTagService);
exports.blogTagController = blogTagController;
