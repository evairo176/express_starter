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
exports.ImageController = void 0;
const middlewares_1 = require("../../middlewares");
const response_1 = __importDefault(require("../../cummon/utils/response"));
const http_config_1 = require("../../config/http.config");
const image_schema_1 = require("../../cummon/zod/image.schema");
class ImageController {
    constructor(ImageService) {
        /**
         * POST /images
         * - multer upload.fields(fileFields) expected to be used on route
         * - body validated by CreateImageSchema (folder, imageUrls, name, tags, etc)
         */
        this.create = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            // Validate body
            const parsed = image_schema_1.CreateImageSchema.parse(req.body);
            // Collect files from req (support both array and fields)
            const multerFiles = this.collectFiles(req);
            const fileInputs = multerFiles
                .filter((f) => !!f.buffer)
                .map((f) => ({ buffer: f.buffer, originalname: f.originalname }));
            const dto = {
                files: fileInputs,
                imageUrls: (_a = parsed.imageUrls) !== null && _a !== void 0 ? _a : [],
                folder: parsed.folder,
                name: (_b = parsed.name) !== null && _b !== void 0 ? _b : undefined,
                tags: (_c = parsed.tags) !== null && _c !== void 0 ? _c : undefined,
            };
            const result = yield this.ImageService.create(dto);
            const createdCount = Array.isArray(result.created)
                ? result.created.length
                : 0;
            const errorCount = Array.isArray(result.errors)
                ? result.errors.length
                : 0;
            const msg = createdCount > 0
                ? `${createdCount} image(s) uploaded${errorCount ? `, ${errorCount} failed` : ''}`
                : `No images uploaded${errorCount ? `, ${errorCount} errors` : ''}`;
            const payload = {
                created: result.created,
                errors: result.errors,
            };
            return response_1.default.success(res, payload, msg, http_config_1.HTTPSTATUS.CREATED, {
                createdCount,
                errorCount,
            });
        }));
        this.findAll = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            // Ambil semua query dari req.query (semua value dari express selalu string)
            const { page, limit, sortBy, sortDir, search, userId } = req.query;
            // Normalisasi query params
            const normalized = {
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 10,
                sortBy: (_a = sortBy) !== null && _a !== void 0 ? _a : 'createdAt',
                sortDir: (_b = sortDir) !== null && _b !== void 0 ? _b : 'desc',
                search: search !== null && search !== void 0 ? search : undefined,
                userId: userId !== null && userId !== void 0 ? userId : undefined,
            };
            // Panggil service
            const { data, metadata } = yield this.ImageService.findAll(normalized);
            return response_1.default.success(res, data, `Find all images successfully`, http_config_1.HTTPSTATUS.OK, metadata);
        }));
        this.ImageService = ImageService;
    }
    /**
     * Helper: collect files from req.files in both shapes:
     * - MulterFile[] (upload.array)
     * - { [fieldname]: MulterFile[] } (upload.fields)
     */
    collectFiles(req) {
        const filesRaw = req.files;
        if (!filesRaw)
            return [];
        // Case 1: array (upload.array)
        if (Array.isArray(filesRaw)) {
            return filesRaw;
        }
        // Case 2: object (upload.fields) -> flatten all arrays
        if (typeof filesRaw === 'object') {
            const flattened = [];
            for (const key of Object.keys(filesRaw)) {
                const entry = filesRaw[key];
                if (Array.isArray(entry))
                    flattened.push(...entry);
            }
            return flattened;
        }
        return [];
    }
}
exports.ImageController = ImageController;
