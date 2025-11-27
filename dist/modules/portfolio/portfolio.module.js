"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.portfolioController = exports.portfolioService = void 0;
const portfolio_controller_1 = require("./portfolio.controller");
const portfolio_service_1 = require("./portfolio.service");
const portfolioService = new portfolio_service_1.PortfolioService();
exports.portfolioService = portfolioService;
const portfolioController = new portfolio_controller_1.PortfolioController(portfolioService);
exports.portfolioController = portfolioController;
