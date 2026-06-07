"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupController = exports.backupService = void 0;
const backup_controller_1 = require("./backup.controller");
const backup_service_1 = require("./backup.service");
Object.defineProperty(exports, "backupService", { enumerable: true, get: function () { return backup_service_1.backupService; } });
const backupController = new backup_controller_1.BackupController(backup_service_1.backupService);
exports.backupController = backupController;
