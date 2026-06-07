import { config } from '../../config/app.config';
import { db } from '../../database/database';

/**
 * A single entry in a sitemap: a canonical URL to be emitted as a <loc>.
 */
export interface SitemapEntry {
  url: string;
}

/**
 * Shape of a content item (portfolio project or blog post) that meta tags
 * can be derived from. Fields are intentionally loose so both portfolio and
 * blog post records can be passed in.
 */
export interface MetaSourceItem {
  title?: string | null;
  metaTitle?: string | null;
  metaDesc?: string | null;
  metaImage?: string | null;
  shortDesc?: string | null;
  excerpt?: string | null;
  coverImage?: string | null;
}

export interface MetaResult {
  title: string;
  description: string;
  og: {
    title: string;
    description: string;
    image: string;
  };
}

/**
 * Escape the small set of XML-significant characters so that arbitrary URL
 * strings can be embedded inside a <loc> element and parsed back losslessly.
 */
function escapeXml(value: string): string {
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
function unescapeXml(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

export class SeoService {
  /**
   * Build an XML sitemap string containing a <loc> for each entry's canonical
   * URL. Round-trip safe with {@link parseSitemap}.
   */
  public buildSitemap(items: SitemapEntry[]): string {
    const urls = items
      .map((item) => `  <url>\n    <loc>${escapeXml(item.url)}</loc>\n  </url>`)
      .join('\n');

    return (
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `${urls}${urls ? '\n' : ''}` +
      `</urlset>\n`
    );
  }

  /**
   * Parse an XML sitemap string and return the list of <loc> URLs in document
   * order. Round-trip safe with {@link buildSitemap}.
   */
  public parseSitemap(xml: string): string[] {
    const matches = xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g);
    const urls: string[] = [];
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
  public buildMeta(item: MetaSourceItem): MetaResult {
    const title = item.metaTitle?.trim() ? item.metaTitle : (item.title ?? '');

    const description = item.metaDesc?.trim()
      ? item.metaDesc
      : (item.shortDesc ?? item.excerpt ?? '');

    const image = item.metaImage?.trim()
      ? item.metaImage
      : (item.coverImage ?? '');

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
  public async generateSitemap(): Promise<string> {
    const [projects, posts] = await Promise.all([
      db.portfolio.findMany({
        where: { isPublished: true },
        select: { slug: true },
      }),
      db.blogPost.findMany({
        where: { isPublished: true },
        select: { slug: true },
      }),
    ]);

    const entries: SitemapEntry[] = [
      ...projects.map((p) => ({
        url: this.canonicalUrl(`/projects/${p.slug}`),
      })),
      ...posts.map((p) => ({ url: this.canonicalUrl(`/blog/${p.slug}`) })),
    ];

    return this.buildSitemap(entries);
  }

  /**
   * Compose a canonical URL from the configured site base URL and a path.
   */
  private canonicalUrl(path: string): string {
    const base = config.SITE_URL.replace(/\/$/, '');
    const suffix = path.startsWith('/') ? path : `/${path}`;
    return `${base}${suffix}`;
  }
}
