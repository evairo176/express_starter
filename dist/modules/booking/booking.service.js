"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const catch_errors_1 = require("../../cummon/utils/catch-errors");
const database_1 = require("../../database/database");
const START_HOUR = 9;
const END_HOUR = 17;
const SLOT = 15;
class BookingService {
    generateSlots() {
        return __awaiter(this, void 0, void 0, function* () {
            const slots = [];
            for (let h = START_HOUR; h < END_HOUR; h++) {
                for (let m = 0; m < 60; m += SLOT) {
                    const hour = String(h).padStart(2, '0');
                    const minute = String(m).padStart(2, '0');
                    slots.push(`${hour}:${minute}`);
                }
            }
            return slots;
        });
    }
    getAvailableSlots(date) {
        return __awaiter(this, void 0, void 0, function* () {
            const slots = yield this.generateSlots();
            const start = new Date(date);
            const end = new Date(date);
            end.setHours(23, 59, 59);
            const bookings = yield database_1.db.booking.findMany({
                where: {
                    date: {
                        gte: start,
                        lte: end,
                    },
                },
            });
            const booked = bookings.map((b) => b.startTime.toISOString().substring(11, 16));
            return slots.filter((s) => !booked.includes(s));
        });
    }
    createBooking(data) {
        return database_1.db.booking.create({
            data,
        });
    }
    createBookingWithTicket(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const dateOnly = new Date(data.date).toISOString().split('T')[0];
                const startTime = new Date(`${dateOnly}T${data.startTime}:00`);
                const endTime = new Date(`${dateOnly}T${data.endTime}:00`);
                // =============================
                // CHECK SLOT SUDAH DIBOOKING
                // =============================
                const existingBooking = yield tx.booking.findFirst({
                    where: {
                        date: new Date(dateOnly),
                        startTime: startTime,
                    },
                });
                if (existingBooking) {
                    throw new catch_errors_1.BadRequestException('Slot waktu sudah dibooking, silakan pilih jam lain', "SCHEDULE_ALREADY_EXISTS" /* ErrorCode.SCHEDULE_ALREADY_EXISTS */);
                }
                // =============================
                // CREATE BOOKING
                // =============================
                const booking = yield tx.booking.create({
                    data: {
                        date: new Date(dateOnly),
                        startTime,
                        endTime,
                    },
                });
                // =============================
                // CREATE TICKET
                // =============================
                const ticket = yield tx.ticket.create({
                    data: {
                        title: data.title,
                        description: data.description,
                        requestType: data.requestType,
                        doxaReason: data.doxaReason,
                        bookingId: booking.id,
                    },
                });
                return { booking, ticket };
            }));
        });
    }
}
exports.BookingService = BookingService;
