import { jaccard, termSet } from './normalize';
import type { ApiInput } from './types';

export interface DuplicatePair {
  aId: string;
  bId: string;
  aName: string;
  bName: string;
  similarity: number;
  sharedTerms: string[];
}

/**
 * Pairwise API overlap: shared vocabulary across names, descriptions,
 * paths and summaries. Flags candidates an architect should *review* for
 * consolidation — never an automatic merge decision.
 */
export function findDuplicates(
  apis: ApiInput[],
  threshold = 0.3,
): DuplicatePair[] {
  const corpora = new Map<string, Set<string>>();
  for (const api of apis) {
    const bits = [
      api.name,
      api.baseUrl ?? '',
      api.description ?? '',
      ...api.operations.flatMap((o) => [
        o.path,
        o.summary ?? '',
        o.description ?? '',
      ]),
    ];
    corpora.set(api.id, termSet(bits.join(' ')));
  }

  const pairs: DuplicatePair[] = [];
  for (let i = 0; i < apis.length; i++) {
    for (let j = i + 1; j < apis.length; j++) {
      const a = corpora.get(apis[i].id)!;
      const b = corpora.get(apis[j].id)!;
      const similarity = jaccard(a, b);
      // Boost when the human-readable names share a head term
      // (customer-x vs customer-y) even with otherwise thin text.
      const nameA = termSet(apis[i].name);
      const nameB = termSet(apis[j].name);
      const nameHit = jaccard(nameA, nameB);
      const blended = Math.min(1, similarity + nameHit * 0.35);
      if (blended >= threshold) {
        pairs.push({
          aId: apis[i].id,
          bId: apis[j].id,
          aName: apis[i].name,
          bName: apis[j].name,
          similarity: Math.round(blended * 100),
          sharedTerms: [...a].filter((t) => b.has(t)).slice(0, 10),
        });
      }
    }
  }
  pairs.sort((x, y) => y.similarity - x.similarity);
  return pairs;
}
