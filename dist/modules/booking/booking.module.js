"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingController = exports.bookingService = void 0;
const booking_controller_1 = require("./booking.controller");
const booking_service_1 = require("./booking.service");
const bookingService = new booking_service_1.BookingService();
exports.bookingService = bookingService;
const bookingController = new booking_controller_1.BookingController(bookingService);
exports.bookingController = bookingController;
