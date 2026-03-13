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
exports.TicketController = void 0;
const middlewares_1 = require("../../middlewares");
class TicketController {
    constructor(ticketService) {
        this.createTicket = (0, middlewares_1.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const ticket = yield this.ticketService.createTicket(req.body);
            return res.json(ticket);
        }));
        this.getTickets = (0, middlewares_1.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const ticket = yield this.ticketService.createTicket(req.body);
            return res.json(ticket);
        }));
        this.getTicketById = (0, middlewares_1.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const ticket = yield this.ticketService.getTicketById(req.params.id);
            return res.json(ticket);
        }));
        this.assignTicket = (0, middlewares_1.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { ticketId, picId } = req.body;
            const ticket = yield this.ticketService.assignTicket(ticketId, picId);
            return res.json(ticket);
        }));
        this.finishTicket = (0, middlewares_1.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const ticket = yield this.ticketService.finishTicket(req.params.id);
            return res.json(ticket);
        }));
        this.ticketService = ticketService;
    }
}
exports.TicketController = TicketController;
