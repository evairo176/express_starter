import { Router } from 'express';

import { authenticateJWT } from '../../common/strategies/jwt.strategy';
import { upload } from '../../common/utils/multer';
import { backupController } from './backup.module';

/**
 * @swagger
 * tags:
 *   name: Backup
 *   description: Admin-only database backup and restore
 *
 * All routes here are authenticated (admin/JWT). The import route is
 * destructive — it overwrites the database from an uploaded dump — and runs a
 * schema/has-data validation before restoring.
 */
const backupRoutes = Router();

// Every backup route requires authentication.
backupRoutes.use(authenticateJWT);

/**
 * @swagger
 * /backup/validate:
 *   post:
 *     summary: Validate an uploaded database dump (no changes applied)
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Validation report
 *       401:
 *         description: Unauthorized
 */
backupRoutes.post(
  '/validate',
  upload.single('file'),
  backupController.validate,
);

/**
 * @swagger
 * /backup/import:
 *   post:
 *     summary: Restore the database from an uploaded dump (DESTRUCTIVE)
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               confirm:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Database restored
 *       400:
 *         description: Not confirmed or dump failed validation
 *       401:
 *         description: Unauthorized
 */
backupRoutes.post('/import', upload.single('file'), backupController.import);

/**
 * @swagger
 * /backup/now:
 *   post:
 *     summary: Trigger an on-demand backup delivered to Telegram
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Backup created and sent
 *       401:
 *         description: Unauthorized
 */
backupRoutes.post('/now', backupController.runNow);

export default backupRoutes;
