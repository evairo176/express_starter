"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageController = exports.imageService = void 0;
const image_controller_1 = require("./image.controller");
const image_service_1 = require("./image.service");
const imageService = new image_service_1.ImageService();
exports.imageService = imageService;
const imageController = new image_controller_1.ImageController(imageService);
exports.imageController = imageController;
