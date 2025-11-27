// src/config/multer.config.ts
import multer from 'multer';

export type MulterFieldDescriptor = { name: string; maxCount?: number };

// multer memory storage (recommended for immediate upload to cloud)
export const upload = multer({ storage: multer.memoryStorage() });

/**
 * Helper: ubah empty string "" => null
 */
export function emptyToNull<T extends string | null | undefined>(
  v: T,
): T | null {
  return v === '' ? null : (v as T | null);
}

/**
 * Build fileFields from a Sequelize model that exposes getAttributes()
 * Usage:
 *   const fileFields = buildFileFieldsFromSequelizeModel(LegalCompliance, 1);
 *
 * If model does not implement getAttributes, this will throw.
 */
export function buildFileFieldsFromSequelizeModel(
  model: { getAttributes: () => Record<string, unknown> },
  defaultMaxCount = 1,
): MulterFieldDescriptor[] {
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
export function buildFileFieldsFromKeys(
  keys: string[],
  defaultMaxCount = 10,
): MulterFieldDescriptor[] {
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
export const fileFields = buildFileFieldsFromKeys([
  'icon_files',
  'portfolio_files',
]);

// Default export convenience (optional)
export default {
  upload,
  fileFields,
  emptyToNull,
  buildFileFieldsFromKeys,
  buildFileFieldsFromSequelizeModel,
};
