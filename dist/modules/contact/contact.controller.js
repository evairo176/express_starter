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
exports.ContactController = void 0;
const middlewares_1 = require("../../middlewares");
const response_1 = __importDefault(require("../../common/utils/response"));
const http_config_1 = require("../../config/http.config");
const contact_schema_1 = require("../../common/zod/contact.schema");
const pagination_1 = require("../../common/utils/pagination");
class ContactController {
    constructor(contactService) {
        // POST /contact (public). Validation failure -> 400 and nothing persisted
        // (Zod parse throws before the service is called) (Req 7.1, 7.4).
        this.create = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const parsed = contact_schema_1.CreateContactSchema.parse(req.body);
            const result = yield this.contactService.create(parsed);
            return response_1.default.success(res, result, 'Contact message received successfully', http_config_1.HTTPSTATUS.CREATED);
        }));
        // GET /contact (admin). Newest-first with pagination metadata (Req 7.5).
        this.findAll = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const query = pagination_1.PaginationQuerySchema.parse(req.query);
            const { data, metadata } = yield this.contactService.findAll(query);
            return response_1.default.success(res, data, 'Find all contact messages successfully', http_config_1.HTTPSTATUS.OK, metadata);
        }));
        this.contactService = contactService;
    }
}
exports.ContactController = ContactController;
