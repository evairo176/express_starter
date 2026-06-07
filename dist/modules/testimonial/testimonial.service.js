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
exports.TestimonialService = void 0;
const database_1 = require("../../database/database");
class TestimonialService {
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            return database_1.db.testimonial.create({
                data: {
                    authorName: data.authorName,
                    authorRole: data.authorRole,
                    quote: data.quote,
                    isPublished: (_a = data.isPublished) !== null && _a !== void 0 ? _a : false,
                },
            });
        });
    }
    findPublished() {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.testimonial.findMany({
                where: { isPublished: true },
                orderBy: { createdAt: 'desc' },
            });
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.testimonial.findUnique({ where: { id } });
        });
    }
    setPublished(id, isPublished) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.testimonial.update({
                where: { id },
                data: { isPublished },
            });
        });
    }
}
exports.TestimonialService = TestimonialService;
