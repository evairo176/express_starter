"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.portfolioTagController = exports.portfolioTagService = void 0;
const portfolioTag_controller_1 = require("./portfolioTag.controller");
const portfolioTag_service_1 = require("./portfolioTag.service");
const portfolioTagService = new portfolioTag_service_1.PortfolioTagService();
exports.portfolioTagService = portfolioTagService;
const portfolioTagController = new portfolioTag_controller_1.PortfolioTagController(portfolioTagService);
exports.portfolioTagController = portfolioTagController;
