"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blogCategoryController = exports.blogCategoryService = void 0;
const blogCategory_controller_1 = require("./blogCategory.controller");
const blogCategory_service_1 = require("./blogCategory.service");
const blogCategoryService = new blogCategory_service_1.BlogCategoryService();
exports.blogCategoryService = blogCategoryService;
const blogCategoryController = new blogCategory_controller_1.BlogCategoryController(blogCategoryService);
exports.blogCategoryController = blogCategoryController;
