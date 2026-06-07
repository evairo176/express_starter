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
exports.ContactService = void 0;
const database_1 = require("../../database/database");
const mailer_1 = require("../../mailers/mailer");
const app_config_1 = require("../../config/app.config");
const logger_1 = __importDefault(require("../../libs/logger"));
const pagination_1 = require("../../common/utils/pagination");
// The owner notification recipient. Falls back to MAILER_SENDER when
// CONTACT_OWNER_EMAIL is not configured.
const ownerEmail = app_config_1.config.CONTACT_OWNER_EMAIL || app_config_1.config.MAILER_SENDER;
class ContactService {
    /**
     * Persist a contact message, then attempt to notify the owner via email.
     * The email send is wrapped in try/catch so that an email failure is logged
     * and swallowed — the message stays persisted and the caller still receives
     * a success result (Req 7.1, 7.2, 7.3).
     */
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = yield database_1.db.contactMessage.create({
                data: {
                    name: data.name,
                    email: data.email,
                    subject: data.subject,
                    body: data.body,
                },
            });
            try {
                yield (0, mailer_1.sendEmail)({
                    to: ownerEmail,
                    subject: `New contact message: ${data.subject}`,
                    text: `You received a new contact message from ${data.name} <${data.email}>.\n\nSubject: ${data.subject}\n\n${data.body}`,
                    html: `<p>You received a new contact message from <strong>${data.name}</strong> &lt;${data.email}&gt;.</p>
<p><strong>Subject:</strong> ${data.subject}</p>
<p>${data.body}</p>`,
                });
            }
            catch (error) {
                logger_1.default.error(`Failed to send contact notification email for message ${message.id}: ${error instanceof Error ? error.message : String(error)}`);
            }
            return message;
        });
    }
    /**
     * Return persisted contact messages ordered by creation time descending
     * (newest-first) with pagination metadata (Req 7.5).
     */
    findAll(_a) {
        return __awaiter(this, arguments, void 0, function* ({ page = 1, limit = 10 }) {
            const skip = (page - 1) * limit;
            const [total, messages] = yield Promise.all([
                database_1.db.contactMessage.count(),
                database_1.db.contactMessage.findMany({
                    orderBy: { createdAt: 'desc' },
                    skip: Number(skip),
                    take: Number(limit),
                }),
            ]);
            return {
                data: messages,
                metadata: (0, pagination_1.buildPaginationMetadata)(total, page, limit),
            };
        });
    }
}
exports.ContactService = ContactService;
