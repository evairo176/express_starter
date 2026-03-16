"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimController = exports.claimService = void 0;
const claim_controller_1 = require("./claim.controller");
const claim_service_1 = require("./claim.service");
const claimService = new claim_service_1.ClaimService();
exports.claimService = claimService;
const claimController = new claim_controller_1.ClaimController(claimService);
exports.claimController = claimController;
