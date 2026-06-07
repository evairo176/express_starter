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
exports.TestimonialController = void 0;
const middlewares_1 = require("../../middlewares");
const response_1 = __importDefault(require("../../common/utils/response"));
const http_config_1 = require("../../config/http.config");
const testimonial_schema_1 = require("../../common/zod/testimonial.schema");
class TestimonialController {
    constructor(testimonialService) {
        this.create = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const parsed = testimonial_schema_1.CreateTestimonialSchema.parse(req.body);
            const result = yield this.testimonialService.create(parsed);
            return response_1.default.success(res, result, `Testimonial created successfully`, http_config_1.HTTPSTATUS.CREATED);
        }));
        this.findPublished = (0, middlewares_1.asyncHandler)((_req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield this.testimonialService.findPublished();
            return response_1.default.success(res, result, `Get published testimonials successfully`, http_config_1.HTTPSTATUS.OK);
        }));
        this.publish = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const existing = yield this.testimonialService.findById(req.params.id);
            if (!existing) {
                return response_1.default.error(res, 'Testimonial not found', http_config_1.HTTPSTATUS.NOT_FOUND);
            }
            const isPublished = typeof ((_a = req.body) === null || _a === void 0 ? void 0 : _a.isPublished) === 'boolean'
                ? req.body.isPublished
                : !existing.isPublished;
            const result = yield this.testimonialService.setPublished(req.params.id, isPublished);
            return response_1.default.success(res, result, `Testimonial published state updated successfully`, http_config_1.HTTPSTATUS.OK);
        }));
        this.testimonialService = testimonialService;
    }
}
exports.TestimonialController = TestimonialController;
