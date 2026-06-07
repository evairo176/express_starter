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
exports.NewsletterController = void 0;
const middlewares_1 = require("../../middlewares");
const response_1 = __importDefault(require("../../common/utils/response"));
const http_config_1 = require("../../config/http.config");
const newsletter_schema_1 = require("../../common/zod/newsletter.schema");
class NewsletterController {
    constructor(newsletterService) {
        this.subscribe = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const parsed = newsletter_schema_1.SubscribeNewsletterSchema.parse(req.body);
            yield this.newsletterService.subscribe(parsed);
            return response_1.default.success(res, null, 'Subscribed to newsletter successfully', http_config_1.HTTPSTATUS.OK);
        }));
        this.unsubscribe = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const token = String((_a = req.query.token) !== null && _a !== void 0 ? _a : '');
            yield this.newsletterService.unsubscribe(token);
            return response_1.default.success(res, null, 'Unsubscribed from newsletter successfully', http_config_1.HTTPSTATUS.OK);
        }));
        this.newsletterService = newsletterService;
    }
}
exports.NewsletterController = NewsletterController;
