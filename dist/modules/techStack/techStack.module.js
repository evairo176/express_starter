"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.techStackController = exports.techStackService = void 0;
const techStack_controller_1 = require("./techStack.controller");
const techStack_service_1 = require("./techStack.service");
const techStackService = new techStack_service_1.TechStackService();
exports.techStackService = techStackService;
const techStackController = new techStack_controller_1.TechStackController(techStackService);
exports.techStackController = techStackController;
