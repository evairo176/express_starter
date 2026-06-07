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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeoService = void 0;
const app_config_1 = require("../../config/app.config");
const database_1 = require("../../database/database");
/**
 * Escape the small set of XML-significant characters so that arbitrary URL
 * strings can be embedded inside a <loc> element and parsed back losslessly.
 */
function escapeXml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
/**
 * Reverse of {@link escapeXml}. The order matters: `&amp;` must be decoded
 * last so that an escaped entity inside the original URL is preserved.
 */
function unescapeXml(value) {
    return value
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&');
}
class SeoService {
    /**
     * Build an XML sitemap string containing a <loc> for each entry's canonical
     * URL. Round-trip safe with {@link parseSitemap}.
     */
    buildSitemap(items) {
        const urls = items
            .map((item) => `  <url>\n    <loc>${escapeXml(item.url)}</loc>\n  </url>`)
            .join('\n');
        return (`<?xml version="1.0" encoding="UTF-8"?>\n` +
            `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
            `${urls}${urls ? '\n' : ''}` +
            `</urlset>\n`);
    }
    /**
     * Parse an XML sitemap string and return the list of <loc> URLs in document
     * order. Round-trip safe with {@link buildSitemap}.
     */
    parseSitemap(xml) {
        const matches = xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g);
        const urls = [];
        for (const match of matches) {
            urls.push(unescapeXml(match[1]));
        }
        return urls;
    }
    /**
     * Derive title, description and Open Graph metadata from a content item.
     *
     * Rules:
     * - If the item defines a `metaImage`, the OG image MUST equal that
     *   `metaImage` (it always wins over any derived/cover image).
     * - If the item has no `metaDesc`, the description is derived from
     *   `shortDesc` (portfolio) or `excerpt` (blog post).
     */
    buildMeta(item) {
        var _a, _b, _c, _d, _e, _f, _g;
        const title = ((_a = item.metaTitle) === null || _a === void 0 ? void 0 : _a.trim())
            ? item.metaTitle
            : ((_b = item.title) !== null && _b !== void 0 ? _b : '');
        const description = ((_c = item.metaDesc) === null || _c === void 0 ? void 0 : _c.trim())
            ? item.metaDesc
            : ((_e = (_d = item.shortDesc) !== null && _d !== void 0 ? _d : item.excerpt) !== null && _e !== void 0 ? _e : '');
        const image = ((_f = item.metaImage) === null || _f === void 0 ? void 0 : _f.trim())
            ? item.metaImage
            : ((_g = item.coverImage) !== null && _g !== void 0 ? _g : '');
        return {
            title,
            description,
            og: {
                title,
                description,
                image,
            },
        };
    }
    /**
     * Build canonical URLs for every published project and published blog post,
     * then serialize them into a sitemap XML string.
     */
    generateSitemap() {
        return __awaiter(this, void 0, void 0, function* () {
            const [projects, posts] = yield Promise.all([
                database_1.db.portfolio.findMany({
                    where: { isPublished: true },
                    select: { slug: true },
                }),
                database_1.db.blogPost.findMany({
                    where: { isPublished: true },
                    select: { slug: true },
                }),
            ]);
            const entries = [
                ...projects.map((p) => ({ url: this.canonicalUrl(`/projects/${p.slug}`) })),
                ...posts.map((p) => ({ url: this.canonicalUrl(`/blog/${p.slug}`) })),
            ];
            return this.buildSitemap(entries);
        });
    }
    /**
     * Compose a canonical URL from the configured site base URL and a path.
     */
    canonicalUrl(path) {
        const base = app_config_1.config.SITE_URL.replace(/\/$/, '');
        const suffix = path.startsWith('/') ? path : `/${path}`;
        return `${base}${suffix}`;
    }
}
exports.SeoService = SeoService;
