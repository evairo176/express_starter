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
    findAll(_a) {
        return __awaiter(this, arguments, void 0, function* ({ page = 1, limit = 10, sortBy = 'updatedAt', sortDir = 'desc', search, }) {
            const skip = (page - 1) * limit;
            // Filter dasar
            const where = {
            // userId,
            // expiredAt: {
            //   gt: new Date(),
            // },
            };
            // Opsional: search pada userAgent
            if (search && search.trim() !== '') {
                where.title = {
                    contains: search,
                    mode: 'insensitive',
                };
            }
            // Hitung total (without pagination)
            const total = yield database_1.db.ticket.count({
                where,
            });
            // Query data
            const tickets = yield database_1.db.ticket.findMany({
                where,
                orderBy: {
                    createdAt: sortDir,
                },
                skip: Number(skip),
                take: Number(limit),
                include: {
                    pic: true,
                    activities: true,
                },
            });
            const totalPages = Math.ceil(total / limit);
            return {
                data: tickets,
                metadata: {
                    total,
                    page,
                    limit,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                    sortBy,
                    sortDir,
                    search: search !== null && search !== void 0 ? search : null,
                },
            };
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
    getPic() {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.user.findMany({
                where: {
                    role: 'PIC_IT',
                },
                select: {
                    name: true,
                    id: true,
                    role: true,
                    roleCode: true,
                    roleRel: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
        });
    }
}
exports.TicketService = TicketService;
exports.ticketService = new TicketService();
