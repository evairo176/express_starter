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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketController = void 0;
const middlewares_1 = require("../../middlewares");
const response_1 = __importDefault(require("../../cummon/utils/response"));
const http_config_1 = require("../../config/http.config");
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
            const { picId } = req.body;
            const ticketId = req.params.id;
            const ticket = yield this.ticketService.assignTicket(ticketId, picId);
            return response_1.default.success(res, ticket, `Assign ticket successfully to pic with id ${picId} ${ticket.title} `, http_config_1.HTTPSTATUS.OK);
        }));
        this.finishTicket = (0, middlewares_1.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const ticket = yield this.ticketService.finishTicket(req.params.id);
            return res.json(ticket);
        }));
        this.getPic = (0, middlewares_1.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const pic = yield this.ticketService.getPic();
            return response_1.default.success(res, pic, 'get pic successfully', http_config_1.HTTPSTATUS.OK);
        }));
        this.findAll = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { data, metadata } = yield this.ticketService.findAll(Object.assign({}, req === null || req === void 0 ? void 0 : req.query));
            return response_1.default.success(res, data, `Find all tickets successfully`, http_config_1.HTTPSTATUS.OK, metadata);
        }));
        this.ticketService = ticketService;
    }
}
exports.TicketController = TicketController;
