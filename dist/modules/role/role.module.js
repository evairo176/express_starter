"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleController = exports.roleService = void 0;
const role_controller_1 = require("./role.controller");
const role_service_1 = require("./role.service");
const roleService = new role_service_1.RoleService();
exports.roleService = roleService;
const roleController = new role_controller_1.RoleController(roleService);
exports.roleController = roleController;
