/** Tokenisation + light stemming used by the deterministic scoring engine. */

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has',
  'in', 'is', 'it', 'its', 'of', 'on', 'or', 'that', 'the', 'to', 'was',
  'were', 'will', 'with', 'which', 'this', 'these', 'those', 'via', 'such',
  'can', 'may', 'than', 'into', 'over', 'under', 'between', 'including',
  'within', 'both', 'all', 'any', 'each', 'other', 'some', 'out', 'up',
  'about', 'against', 'during', 'before', 'after', 'not', 'no', 'do',
  'does', 'did', 'so', 'if', 'but', 'then', 'there', 'their', 'they',
  'been', 'being', 'because', 'through', 'api', 'apis', 'rest', 'service',
  'services', 'system', 'data', 'using', 'used', 'use', 'one', 'new',
  'provide', 'provides', 'provided', 'support', 'supports', 'include',
  'includes', 'including', 'cover', 'covers', 'covering', 'range',
  // BIAN control-record filler: currencies / channels that appear in almost
  // every domain description and would otherwise inflate every score.
  'euro', 'dollar', 'sterling', 'yen', 'currencies', 'currency',
  'channel', 'channels', 'device', 'devices',
]);

/**
 * Split camelCase/PascalCase/paths/ids into lowercase word tokens.
 * Drops `{template}` params and numeric id-segments so `/payments/{id}`
 * yields `payment`, not `pay` + `id` fragments.
 */
export function tokenize(text: string | undefined | null): string[] {
  if (!text) return [];
  const noTemplates = String(text).replace(/\{[^}]*\}/g, ' ');
  const spaced = noTemplates.replace(
    /(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/g,
    ' ',
  );
  return spaced
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean)
    .map(stem)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

/** Very small deterministic stemmer: plural/forms -> base. */
export function stem(word: string): string {
  if (word.length <= 4) return word;
  if (word.endsWith('ies') && word.length > 5) return word.slice(0, -3) + 'y';
  if (word.endsWith('sses') || word.endsWith('shes') || word.endsWith('ches')) {
