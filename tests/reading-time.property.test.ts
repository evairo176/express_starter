// Feature: portfolio-upgrade, Property 19: Reading time formula
import fc from 'fast-check';
import {
  calculateReadingTime,
  countWords,
} from '../src/common/utils/reading-time';

/**
 * Property 19: Reading time formula
 *
 * For any content string, calculateReadingTime(content) ===
 * max(1, ceil(countWords(content) / 200)). Also asserts the minimum-1
 * behavior for empty/whitespace-only content.
 *
 * Validates: Requirements 6.1
 */
describe('Property 19: Reading time formula', () => {
  it('equals max(1, ceil(wordCount / 200)) for arbitrary content', () => {
    // Generator covering empty, whitespace-only, non-ASCII, and long texts.
    const contentArb = fc.oneof(
      fc.string(),
      // Whitespace-heavy strings (spaces, tabs, newlines, mixed words).
      fc.array(
        fc.constantFrom('', ' ', '\t', '\n', '\r\n', '   ', 'word', 'héllo', '日本語', 'a'),
        { maxLength: 50 },
      ).map((tokens) => tokens.join(' ')),
      // Long unicode text to exercise multi-minute results.
      fc.string({ unit: 'grapheme', maxLength: 5000 }),
      // Explicit empty / whitespace-only edge cases.
      fc.constantFrom('', '   ', '\t\n\r', '     \n   \t  '),
    );

    fc.assert(
      fc.property(contentArb, (content) => {
        const expected = Math.max(1, Math.ceil(countWords(content) / 200));
        expect(calculateReadingTime(content)).toBe(expected);
      }),
      { numRuns: 200 },
    );
  });

  it('returns a minimum of 1 minute for empty/whitespace-only content', () => {
    const blankArb = fc.oneof(
      fc.constant(''),
      // Strings composed solely of whitespace characters.
      fc.array(fc.constantFrom(' ', '\t', '\n', '\r'), { maxLength: 100 }).map(
        (chars) => chars.join(''),
      ),
    );

    fc.assert(
      fc.property(blankArb, (blank) => {
        expect(countWords(blank)).toBe(0);
        expect(calculateReadingTime(blank)).toBe(1);
      }),
      { numRuns: 100 },
    );
  });
});
