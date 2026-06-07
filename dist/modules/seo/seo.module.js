"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seoController = exports.seoService = void 0;
const seo_controller_1 = require("./seo.controller");
const seo_service_1 = require("./seo.service");
const seoService = new seo_service_1.SeoService();
exports.seoService = seoService;
const seoController = new seo_controller_1.SeoController(seoService);
exports.seoController = seoController;
