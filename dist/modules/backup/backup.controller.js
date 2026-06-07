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
exports.BackupController = void 0;
const middlewares_1 = require("../../middlewares");
const response_1 = __importDefault(require("../../common/utils/response"));
const http_config_1 = require("../../config/http.config");
const logger_1 = __importDefault(require("../../libs/logger"));
/**
 * Admin-only backup/restore endpoints. All routes are mounted behind
 * `authenticateJWT` (see `backup.routes.ts`); the import path is destructive
 * (it drops and recreates the database from the uploaded dump), so the upload
 * is always validated for schema compatibility + non-empty data before any
 * restore runs.
 */
class BackupController {
    constructor(backupService) {
        /**
         * POST /backup/validate — validate an uploaded dump without touching the DB.
         * Returns the structured validation report (schema match + has-data).
         */
        this.validate = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const file = this.getUploadedFile(req);
            const validation = yield this.backupService.validateBuffer(file.buffer, file.originalname);
            return response_1.default.success(res, validation, validation.ok
                ? 'Dump is valid and ready to restore'
                : 'Dump failed validation', http_config_1.HTTPSTATUS.OK);
        }));
        /**
         * POST /backup/import — validate then restore an uploaded dump into the
         * live database. Destructive and atomic. Requires `confirm=true` in the body
         * as an explicit safety acknowledgement.
         */
        this.import = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const confirm = (_a = req.body) === null || _a === void 0 ? void 0 : _a.confirm;
            const confirmed = confirm === true || confirm === 'true';
            if (!confirmed) {
                return response_1.default.error(res, 'Restore not confirmed. Send confirm=true to proceed (this overwrites the database).', http_config_1.HTTPSTATUS.BAD_REQUEST);
            }
            const file = this.getUploadedFile(req);
            logger_1.default.warn(`[backup] admin-triggered restore from upload: ${file.originalname} (${file.size} bytes)`);
            const result = yield this.backupService.importBuffer(file.buffer, file.originalname);
            return response_1.default.success(res, result, 'Database restored successfully', http_config_1.HTTPSTATUS.OK);
        }));
        /**
         * POST /backup/now — trigger an on-demand backup that is dumped and
         * delivered to the configured Telegram chat (same flow as the daily cron).
         */
        this.runNow = (0, middlewares_1.asyncHandler)((_req, res) => __awaiter(this, void 0, void 0, function* () {
            const fileName = yield this.backupService.runBackup();
            return response_1.default.success(res, { fileName }, 'Backup created and sent to Telegram', http_config_1.HTTPSTATUS.OK);
        }));
        this.backupService = backupService;
    }
    /** Pull the uploaded file off the multer single-file request. */
    getUploadedFile(req) {
        const file = req.file;
        if (!file || !file.buffer || file.buffer.length === 0) {
            throw new Error('No backup file uploaded (expected field "file")');
        }
        return file;
    }
}
exports.BackupController = BackupController;
