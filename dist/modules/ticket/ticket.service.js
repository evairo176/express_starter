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
exports.ticketService = exports.TicketService = void 0;
const database_1 = require("../../database/database");
class TicketService {
    createTicket(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.ticket.create({
                data,
            });
        });
    }
    getTickets() {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.ticket.findMany({
                include: {
                    pic: true,
                    activities: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
        });
    }
    getTicketById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.ticket.findUnique({
                where: { id },
                include: {
                    pic: true,
                    activities: true,
                },
            });
        });
    }
    assignTicket(ticketId, picId) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.ticket.update({
                where: { id: ticketId },
                data: {
                    picId,
                    status: 'IN_PROGRESS',
                    startedAt: new Date(),
                },
            });
        });
    }
    finishTicket(ticketId) {
        return __awaiter(this, void 0, void 0, function* () {
            const ticket = yield database_1.db.ticket.findUnique({
                where: { id: ticketId },
            });
            if (!(ticket === null || ticket === void 0 ? void 0 : ticket.startedAt)) {
                throw new Error('Ticket belum dimulai');
            }
            const finishedAt = new Date();
            const duration = (finishedAt.getTime() - ticket.startedAt.getTime()) / 60000;
            return database_1.db.ticket.update({
                where: { id: ticketId },
                data: {
                    status: 'DONE',
                    finishedAt,
                    durationMin: Math.round(duration),
                },
            });
        });
    }
}
exports.TicketService = TicketService;
exports.ticketService = new TicketService();
