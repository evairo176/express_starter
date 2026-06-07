import { Router } from 'express';
import { seoController } from './seo.module';

/**
 * @swagger
 * tags:
 *   name: SEO
 *   description: SEO support (sitemap, metadata)
 */
const seoRoutes = Router();

/**
 * @swagger
 * /sitemap.xml:
 *   get:
 *     summary: Get the XML sitemap of all published projects and blog posts
 *     tags: [SEO]
 *     responses:
 *       200:
 *         description: XML sitemap
 *         content:
 *           application/xml:
 *             schema:
 *               type: string
 */
seoRoutes.get('/sitemap.xml', seoController.sitemap);

export default seoRoutes;
