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
    return word.slice(0, -2);
  }
  if (word.endsWith('s') && word.length > 4 && !word.endsWith('ss')) {
    const singular = word.slice(0, -1);
    // Avoid mangling -tion/-sion/-ment/-ness stems: transactions -> transaction.
    if (
      singular.endsWith('tion') ||
      singular.endsWith('sion') ||
      singular.endsWith('ment') ||
      singular.endsWith('ness')
    ) {
      return singular;
    }
    if (singular.endsWith('e') && singular.length > 4) {
      const shorter = singular.slice(0, -1);
      if (/(fer|posi|trac|ac)$/.test(shorter)) return singular;
    }
    return singular;
  }
  if (word.endsWith('ing') && word.length > 6) return word.slice(0, -3);
  return word;
}

export function termSet(text: string | undefined | null): Set<string> {
  return new Set(tokenize(text));
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

/**
 * Recall of `needles` inside `haystack`: how much of the (small) needle set
 * is covered. Used for name-term and description coverage where the API side
 * is small and a full Jaccard union would drown the signal.
 */
export function recall(needles: Set<string>, haystack: Set<string>): number {
  if (needles.size === 0) return 0;
  let hit = 0;
  for (const t of needles) if (haystack.has(t)) hit++;
  return hit / needles.size;
}
