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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageService = void 0;
// src/services/imageService.ts
const stream_1 = require("stream");
const database_1 = require("../../database/database"); // sesuai permintaan Anda
const cloudinary_1 = __importDefault(require("../../cummon/utils/cloudinary"));
class ImageService {
    /**
     * Upload buffer -> Cloudinary using upload_stream (Readable.from)
     */
    uploadBufferToCloudinary(buffer, folder = 'portfolio') {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.default.uploader.upload_stream({ folder, resource_type: 'image' }, (error, result) => {
                if (result)
                    resolve(result);
                else
                    reject(error);
            });
            stream_1.Readable.from(buffer).pipe(uploadStream);
        });
    }
    uploadUrlToCloudinary(url, folder = 'portfolio') {
        return cloudinary_1.default.uploader.upload(url, { folder, resource_type: 'image' });
    }
    /**
     * Create images (multiple files and/or urls).
     * Returns created DB records and array of errors (per input index).
     */
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            const { files = [], imageUrls = [], folder = 'portfolio', name = null, tags = [], } = data;
            // prepare promises and mapping so we can map errors to input index
            const uploadPromises = [];
            const sourceMap = [];
            let idx = 0;
            for (const f of files) {
                if (!f.buffer)
                    continue;
                uploadPromises.push(this.uploadBufferToCloudinary(f.buffer, folder));
                sourceMap.push({
                    type: 'file',
                    originalname: f.originalname,
                    inputIndex: idx++,
                });
            }
            for (const u of imageUrls) {
                uploadPromises.push(this.uploadUrlToCloudinary(u, folder));
                sourceMap.push({
                    type: 'url',
                    originalname: undefined,
                    inputIndex: idx++,
                });
            }
            if (uploadPromises.length === 0) {
                throw new Error('No files or imageUrls provided');
            }
            const settled = yield Promise.allSettled(uploadPromises);
            const createdRecords = [];
            const errors = [];
            const cleanupPublicIds = [];
            // For each successful upload -> create DB record
            for (let i = 0; i < settled.length; i++) {
                const s = settled[i];
                const src = sourceMap[i];
                if (s.status === 'fulfilled') {
                    const res = s.value;
                    const dbData = {
                        publicId: res.public_id,
                        url: res.url,
                        secureUrl: (_a = res.secure_url) !== null && _a !== void 0 ? _a : null,
                        folder: (_b = res.folder) !== null && _b !== void 0 ? _b : folder,
                        name: (_c = name !== null && name !== void 0 ? name : res.original_filename) !== null && _c !== void 0 ? _c : null,
                        originalFilename: (_d = res.original_filename) !== null && _d !== void 0 ? _d : null,
                        format: (_e = res.format) !== null && _e !== void 0 ? _e : null,
                        width: (_f = res.width) !== null && _f !== void 0 ? _f : null,
                        height: (_g = res.height) !== null && _g !== void 0 ? _g : null,
                        bytes: (_h = res.bytes) !== null && _h !== void 0 ? _h : null,
                        resourceType: (_j = res.resource_type) !== null && _j !== void 0 ? _j : null,
                        uploadedAt: res.created_at ? new Date(res.created_at) : null,
                        provider: 'cloudinary',
                        tags: Array.isArray(tags) ? tags : ((_k = res.tags) !== null && _k !== void 0 ? _k : []),
                    };
                    try {
                        const record = yield database_1.db.image.create({ data: dbData });
                        createdRecords.push(record);
                    }
                    catch (dbErr) {
                        // DB failed for this uploaded asset -> schedule cleanup
                        cleanupPublicIds.push(res.public_id);
                        errors.push({
                            index: src.inputIndex,
                            message: `DB error: ${(_l = dbErr.message) !== null && _l !== void 0 ? _l : String(dbErr)}`,
                        });
                    }
                }
                else {
                    // Upload failed
                    const reason = (_m = s.reason) !== null && _m !== void 0 ? _m : s;
                    errors.push({
                        index: src.inputIndex,
                        message: reason && reason.message ? reason.message : String(reason),
                    });
                }
            }
            // Attempt best-effort cleanup for uploads that succeeded but DB insert failed
            if (cleanupPublicIds.length > 0) {
                for (const pid of cleanupPublicIds) {
                    try {
                        yield cloudinary_1.default.uploader.destroy(pid, { resource_type: 'image' });
                    }
                    catch (cleanupErr) {
                        // log and continue
                        console.error('Failed to cleanup Cloudinary asset', pid, cleanupErr);
                    }
                }
            }
            return { created: createdRecords, errors };
        });
    }
    /**
     * Find all images with pagination, sorting, and optional search.
     * Follows your method signature in example (userId optional, page/limit, sortBy, sortDir, search)
     */
    findAll(_a) {
        return __awaiter(this, arguments, void 0, function* ({ userId, page = 1, limit = 10, sortBy = 'createdAt', sortDir = 'desc', search, }) {
            const skip = (page - 1) * limit;
            const where = {};
            // If you have user relationship, uncomment and use:
            // if (userId) where.userId = userId;
            if (search && search.trim() !== '') {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { originalFilename: { contains: search, mode: 'insensitive' } },
                    { publicId: { contains: search, mode: 'insensitive' } },
                ];
            }
            const total = yield database_1.db.image.count({ where });
            const images = yield database_1.db.image.findMany({
                where,
                orderBy: { [sortBy]: sortDir },
                skip: Number(skip),
                take: Number(limit),
            });
            const totalPages = Math.ceil(total / limit);
            return {
                data: images,
                metadata: {
                    total,
                    page,
                    limit,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                    sortBy,
                    sortDir,
                    search: search !== null && search !== void 0 ? search : null,
                },
            };
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.image.findUnique({ where: { id } });
        });
    }
    update(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id, tags } = data, rest = __rest(data, ["id", "tags"]);
            // Build update object secara eksplisit agar sesuai dengan Prisma types
            const updateData = Object.assign({}, rest);
            if (tags !== undefined) {
                if (tags === null) {
                    // jika ingin mengosongkan tags saat null -> set ke empty array
                    updateData.tags = { set: [] };
                }
                else {
                    // tags adalah string[] -> set ke array tersebut
                    updateData.tags = { set: tags };
                }
            }
            return database_1.db.image.update({
                where: { id },
                data: updateData,
            });
        });
    }
    /**
     * Delete image by id or publicId.
     * - If id provided: lookup record -> get publicId -> delete Cloudinary -> delete DB record
     * - If publicId provided: delete Cloudinary -> delete DB record by publicId
     */
    delete(identifier) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { id, publicId } = identifier;
            let targetPublicId = publicId;
            if (!targetPublicId) {
                if (!id)
                    throw new Error('id or publicId required');
                const existing = yield database_1.db.image.findUnique({ where: { id } });
                if (!existing)
                    return { deleted: null, cloudinaryResult: null };
                targetPublicId = existing.publicId;
            }
            // Setelah guard di atas, pastikan TS tahu ini bukan undefined:
            if (!targetPublicId) {
                // ekstra safety — seharusnya tidak pernah terjadi karena guard sebelumnya
                throw new Error('targetPublicId is undefined');
            }
            const pid = targetPublicId; // sekarang pid bertipe string murni
            try {
                const destroyRes = yield cloudinary_1.default.uploader.destroy(pid, {
                    resource_type: 'image',
                });
                if (destroyRes.result === 'ok' || destroyRes.result === 'not_found') {
                    const deleted = yield database_1.db.image.delete({
                        where: { publicId: pid },
                    });
                    return { deleted, cloudinaryResult: destroyRes };
                }
                return { deleted: null, cloudinaryResult: destroyRes };
            }
            catch (err) {
                throw new Error(`Cloudinary deletion failed: ${(_a = err.message) !== null && _a !== void 0 ? _a : String(err)}`);
            }
        });
    }
}
exports.ImageService = ImageService;
