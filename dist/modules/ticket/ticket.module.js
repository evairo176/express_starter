"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ticketController = exports.ticketService = void 0;
const ticket_controller_1 = require("./ticket.controller");
const ticket_service_1 = require("./ticket.service");
const ticketService = new ticket_service_1.TicketService();
exports.ticketService = ticketService;
const ticketController = new ticket_controller_1.TicketController(ticketService);
exports.ticketController = ticketController;
