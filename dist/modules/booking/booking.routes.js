"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const booking_module_1 = require("./booking.module");
const bookingRoutes = (0, express_1.Router)();
bookingRoutes.get('/slots', booking_module_1.bookingController.getSlots);
bookingRoutes.post('/', booking_module_1.bookingController.createBookingWithTicket);
exports.default = bookingRoutes;
