"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newsletterController = exports.newsletterService = void 0;
const newsletter_controller_1 = require("./newsletter.controller");
const newsletter_service_1 = require("./newsletter.service");
const newsletterService = new newsletter_service_1.NewsletterService();
exports.newsletterService = newsletterService;
const newsletterController = new newsletter_controller_1.NewsletterController(newsletterService);
exports.newsletterController = newsletterController;
