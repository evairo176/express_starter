"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const seo_module_1 = require("./seo.module");
/**
 * @swagger
 * tags:
 *   name: SEO
 *   description: SEO support (sitemap, metadata)
 */
const seoRoutes = (0, express_1.Router)();
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
seoRoutes.get('/sitemap.xml', seo_module_1.seoController.sitemap);
exports.default = seoRoutes;
