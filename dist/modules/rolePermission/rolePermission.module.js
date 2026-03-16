"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolePermissionController = exports.rolePermissionService = void 0;
const rolePermission_controller_1 = require("./rolePermission.controller");
const rolePermission_service_1 = require("./rolePermission.service");
const rolePermissionService = new rolePermission_service_1.RolePermissionService();
exports.rolePermissionService = rolePermissionService;
const rolePermissionController = new rolePermission_controller_1.RolePermissionController(rolePermissionService);
exports.rolePermissionController = rolePermissionController;
