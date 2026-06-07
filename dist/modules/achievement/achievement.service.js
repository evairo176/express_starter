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
exports.AchievementService = void 0;
const database_1 = require("../../database/database");
class AchievementService {
    /**
     * Public: published achievements ordered by position asc then date desc.
     */
    getPublic() {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.achievement.findMany({
                where: { isPublished: true },
                orderBy: [{ position: 'asc' }, { date: 'desc' }],
            });
        });
    }
    /**
     * Admin: paginated list of all achievements (published or not), ordered by
     * position asc then date desc.
     */
    findAll(_a) {
        return __awaiter(this, arguments, void 0, function* ({ page = 1, limit = 10, }) {
            const skip = (page - 1) * limit;
            const total = yield database_1.db.achievement.count();
            const achievements = yield database_1.db.achievement.findMany({
                orderBy: [{ position: 'asc' }, { date: 'desc' }],
                skip: Number(skip),
                take: Number(limit),
            });
            const totalPages = Math.ceil(total / limit);
            return {
                data: achievements,
                metadata: {
                    total,
                    page,
                    limit,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                },
            };
        });
    }
    findOne(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.achievement.findUnique({ where: { id } });
        });
    }
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g;
            return database_1.db.achievement.create({
                data: {
                    title: data.title,
                    issuer: (_a = data.issuer) !== null && _a !== void 0 ? _a : null,
                    description: (_b = data.description) !== null && _b !== void 0 ? _b : null,
                    date: data.date,
                    url: (_c = data.url) !== null && _c !== void 0 ? _c : null,
                    icon: (_d = data.icon) !== null && _d !== void 0 ? _d : null,
                    category: (_e = data.category) !== null && _e !== void 0 ? _e : null,
                    position: (_f = data.position) !== null && _f !== void 0 ? _f : 0,
                    isPublished: (_g = data.isPublished) !== null && _g !== void 0 ? _g : true,
                },
            });
        });
    }
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.achievement.update({
                where: { id },
                data,
            });
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.achievement.delete({ where: { id } });
        });
    }
}
exports.AchievementService = AchievementService;
