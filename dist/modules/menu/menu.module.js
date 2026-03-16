"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.menuController = exports.menuService = void 0;
const menu_controller_1 = require("./menu.controller");
const menu_service_1 = require("./menu.service");
const menuService = new menu_service_1.MenuService();
exports.menuService = menuService;
const menuController = new menu_controller_1.MenuController(menuService);
exports.menuController = menuController;
