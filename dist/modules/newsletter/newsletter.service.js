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
exports.NewsletterService = void 0;
const uuid_1 = require("../../common/utils/uuid");
const database_1 = require("../../database/database");
const logger_1 = __importDefault(require("../../libs/logger"));
class NewsletterService {
    /**
     * Subscribe an email to the newsletter.
     *
     * Idempotent: a duplicate email (unique-constraint violation) or any
     * lookup failure is treated as "already subscribed" and resolves
     * successfully without creating a duplicate subscription (Req 8.1, 8.2).
     */
    subscribe(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existing = yield database_1.db.newsletterSubscription.findUnique({
                    where: { email: data.email },
                });
                if (existing) {
                    // Already subscribed -> idempotent success, no duplicate created.
                    return existing;
                }
            }
            catch (error) {
                // Lookup failed: treat as "already handled" and return success
                // without attempting to create a (possibly duplicate) row (Req 8.2).
                logger_1.default.error('Newsletter subscription lookup failed', error);
                return null;
            }
            try {
                return yield database_1.db.newsletterSubscription.create({
                    data: {
                        email: data.email,
                        unsubscribeToken: (0, uuid_1.generateUniqueCode)(),
                    },
                });
            }
            catch (error) {
                // Unique-constraint violation (race condition) -> idempotent success.
                logger_1.default.error('Newsletter subscription create failed', error);
                return null;
            }
        });
    }
    /**
     * Mark the subscription matching the given unsubscribe token as inactive
     * and return success (Req 8.4).
     */
    unsubscribe(token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const subscription = yield database_1.db.newsletterSubscription.findUnique({
                    where: { unsubscribeToken: token },
                });
                if (!subscription) {
                    return null;
                }
                return yield database_1.db.newsletterSubscription.update({
                    where: { unsubscribeToken: token },
                    data: { isActive: false },
                });
            }
            catch (error) {
                logger_1.default.error('Newsletter unsubscribe failed', error);
                return null;
            }
        });
    }
}
exports.NewsletterService = NewsletterService;
