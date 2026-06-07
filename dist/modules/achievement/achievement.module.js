"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.achievementController = exports.achievementService = void 0;
const achievement_controller_1 = require("./achievement.controller");
const achievement_service_1 = require("./achievement.service");
const achievementService = new achievement_service_1.AchievementService();
exports.achievementService = achievementService;
const achievementController = new achievement_controller_1.AchievementController(achievementService);
exports.achievementController = achievementController;
