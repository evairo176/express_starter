import fc from 'fast-check';
import { SeoService } from '../src/modules/seo/seo.service';

const seo = new SeoService();

describe('SEO property-based tests', () => {
  // Feature: portfolio-upgrade, Property 33: Sitemap completeness and round-trip. For any set of canonical URLs, parsing the sitemap built from them yields the same set of URLs in the same order; URLs containing XML-special characters (&, <, >, ", ') escape and unescape losslessly.
  // Validates: Requirements 13.1, 16.3
  it('Property 33: sitemap build/parse is round-trip safe', () => {
    // A generator that produces URL-like strings, deliberately seeded with
    // XML-significant characters to exercise the escape/unescape paths.
    const urlArb = fc.oneof(
      fc.webUrl(),
      fc
        .array(
          fc.oneof(
            fc.string({ minLength: 1 }),
            fc.constantFrom('&', '<', '>', '"', "'", '&amp;', '&lt;', '&#x27;')
          ),
          { minLength: 1, maxLength: 5 }
        )
        .map((parts) => `https://example.com/${parts.join('/')}`)
    );

    fc.assert(
      fc.property(fc.array(urlArb, { maxLength: 20 }), (urls) => {
        const items = urls.map((url) => ({ url }));
        const xml = seo.buildSitemap(items);
        const parsed = seo.parseSitemap(xml);

        // Round-trip yields the exact same URLs in the same order.
        expect(parsed).toEqual(urls);
      }),
      { numRuns: 200 }
    );
  });

  // Feature: portfolio-upgrade, Property 34: Meta and Open Graph derivation. For any content item, buildMeta produces a title, a description and Open Graph tags; when metaImage is a non-empty string, og.image equals that metaImage (always wins); when metaDesc is empty/absent, description derives from shortDesc ?? excerpt ?? ''.
  // Validates: Requirements 13.2, 13.3, 13.4
  it('Property 34: meta and Open Graph derivation', () => {
    const optionalNullableStr = fc.option(
      fc.oneof(fc.string(), fc.constant(null)),
      { nil: undefined }
    );

    const itemArb = fc.record({
      title: optionalNullableStr,
      metaTitle: optionalNullableStr,
      metaDesc: optionalNullableStr,
      metaImage: optionalNullableStr,
      shortDesc: optionalNullableStr,
      excerpt: optionalNullableStr,
      coverImage: optionalNullableStr,
    });

    fc.assert(
      fc.property(itemArb, (item) => {
        const meta = seo.buildMeta(item);

        // Always returns title, description and og with string fields.
        expect(typeof meta.title).toBe('string');
        expect(typeof meta.description).toBe('string');
        expect(meta.og).toBeDefined();
        expect(typeof meta.og.title).toBe('string');
        expect(typeof meta.og.description).toBe('string');
        expect(typeof meta.og.image).toBe('string');

        // When metaImage is a non-empty (non-whitespace) string it always wins.
        if (item.metaImage && item.metaImage.trim()) {
          expect(meta.og.image).toBe(item.metaImage);
        }

        // When metaDesc is empty/absent, description derives from shortDesc ?? excerpt ?? ''.
        if (!item.metaDesc || !item.metaDesc.trim()) {
          const expected = item.shortDesc ?? item.excerpt ?? '';
          expect(meta.description).toBe(expected);
        }
      }),
      { numRuns: 200 }
    );
  });
});
