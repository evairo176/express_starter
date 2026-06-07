const WORDS_PER_MINUTE = 200;

/**
 * Counts the number of words in a piece of text/markdown content.
 *
 * Splits on any whitespace and ignores empty tokens so that leading,
 * trailing, or repeated whitespace does not inflate the count. Null or
 * undefined content is treated as 0 words.
 */
export const countWords = (content?: string | null): number => {
  if (!content) return 0;

  return content.split(/\s+/).filter((token) => token.length > 0).length;
};

/**
 * Computes the estimated reading time in whole minutes for the given
 * text/markdown content using `max(1, ceil(wordCount / 200))`.
 *
 * Null/undefined content counts as 0 words and still returns a minimum of
 * 1 minute. The result is always a positive integer.
 */
export const calculateReadingTime = (content?: string | null): number => {
  const wordCount = countWords(content);
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
};

export default calculateReadingTime;
