"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactController = exports.contactService = void 0;
const contact_controller_1 = require("./contact.controller");
const contact_service_1 = require("./contact.service");
const contactService = new contact_service_1.ContactService();
exports.contactService = contactService;
const contactController = new contact_controller_1.ContactController(contactService);
exports.contactController = contactController;
