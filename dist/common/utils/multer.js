"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileFields = exports.upload = void 0;
exports.emptyToNull = emptyToNull;
exports.buildFileFieldsFromSequelizeModel = buildFileFieldsFromSequelizeModel;
exports.buildFileFieldsFromKeys = buildFileFieldsFromKeys;
// src/config/multer.config.ts
const multer_1 = __importDefault(require("multer"));
// multer memory storage (recommended for immediate upload to cloud)
exports.upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
/**
 * Helper: ubah empty string "" => null
 */
function emptyToNull(v) {
    return v === '' ? null : v;
}
/**
 * Build fileFields from a Sequelize model that exposes getAttributes()
 * Usage:
 *   const fileFields = buildFileFieldsFromSequelizeModel(LegalCompliance, 1);
 *
 * If model does not implement getAttributes, this will throw.
 */
function buildFileFieldsFromSequelizeModel(model, defaultMaxCount = 1) {
    if (!model || typeof model.getAttributes !== 'function') {
        throw new Error('Provided model does not have getAttributes()');
    }
    const attrs = model.getAttributes();
    return Object.keys(attrs)
        .filter((key) => key.endsWith('_files'))
        .map((key) => ({ name: key, maxCount: defaultMaxCount }));
}
/**
 * Build fileFields from an explicit array of keys (useful for Prisma or manual config)
 * Example:
 *   const fileFields = buildFileFieldsFromKeys(['icon_files','portfolio_files'], 5);
 */
function buildFileFieldsFromKeys(keys, defaultMaxCount = 10) {
    return keys.map((k) => ({ name: k, maxCount: defaultMaxCount }));
}
/**
 * Example: create a fileFields constant similar to your original code.
 *
 * If you use Sequelize:
 * import LegalCompliance from '../entities/legal_compliance.entity';
 * export const fileFields = buildFileFieldsFromSequelizeModel(LegalCompliance, 1);
 *
 * If you use Prisma or want manual:
 * export const fileFields = buildFileFieldsFromKeys(['icon_files', 'portfolio_files'], 3);
 */
// --- Example exports (uncomment/use whichever fits your project) ---
// 1) Sequelize example (uncomment when using Sequelize model)
// import LegalCompliance from '../entities/legal_compliance.entity';
// export const fileFields = buildFileFieldsFromSequelizeModel(LegalCompliance, 1);
// 2) Prisma / manual example
exports.fileFields = buildFileFieldsFromKeys([
    'icon_files',
    'portfolio_files',
]);
// Default export convenience (optional)
exports.default = {
    upload: exports.upload,
    fileFields: exports.fileFields,
    emptyToNull,
    buildFileFieldsFromKeys,
    buildFileFieldsFromSequelizeModel,
};
