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
exports.SessionController = void 0;
const middlewares_1 = require("../../middlewares");
const http_config_1 = require("../../config/http.config");
const catch_errors_1 = require("../../cummon/utils/catch-errors");
const zod_1 = require("zod");
const response_1 = __importDefault(require("../../cummon/utils/response"));
class SessionController {
    constructor(sessionService) {
        this.getSessionByUser = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.id;
            const sessionId = req.sessionId;
            const { data, metadata } = yield this.sessionService.getSessionByUser(Object.assign(Object.assign({}, req === null || req === void 0 ? void 0 : req.query), { userId }));
            const modifySession = data === null || data === void 0 ? void 0 : data.map((session) => {
                return Object.assign(Object.assign({}, session), { isCurrent: session.id === sessionId ? true : false });
            });
            return response_1.default.success(res, modifySession, `Retrieved all portfolio successfully`, http_config_1.HTTPSTATUS.OK, metadata);
        }));
        this.getSession = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const sessionId = req.sessionId;
            if (!sessionId) {
                throw new catch_errors_1.NotFoundException('Session ID not found. please login again');
            }
            const { user } = yield this.sessionService.getSessionById(sessionId);
            return response_1.default.success(res, user, 'Retrieved session successfully', http_config_1.HTTPSTATUS.OK);
        }));
        this.revokeSession = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const sessionId = zod_1.z.string().parse((_a = req === null || req === void 0 ? void 0 : req.params) === null || _a === void 0 ? void 0 : _a.id);
            const userId = (_b = req === null || req === void 0 ? void 0 : req.user) === null || _b === void 0 ? void 0 : _b.id;
            const session = yield this.sessionService.revokeSession(sessionId, userId);
            return response_1.default.success(res, null, `Session ${session === null || session === void 0 ? void 0 : session.id} revoke successfully`, http_config_1.HTTPSTATUS.OK);
        }));
        this.sessionService = sessionService;
    }
}
exports.SessionController = SessionController;
