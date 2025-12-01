import { termSet, tokenize } from './normalize';
import type { ApiInput, Confidence, Recommendation, ScoreOptions, ServiceDomainProfile } from './types';

/**
 * Deterministic weighted alignment scoring.
 *
 * The bank API text is small; each BIAN domain corpus is large. Plain
 * Jaccard drowns the signal, so every signal below is a *recall* measure
 * (how much of the small side is explained) weighted by IDF over the
 * domain catalog: ubiquitous BIAN verbs (execute, initiate) count little,
 * rare terms (disbursement, mortgage) count a lot. API terms outside the
 * BIAN vocabulary are ignored, never penalised.
 *
 * Scores are this tool's analytical alignment metric (0..100), NOT a
 * BIAN certification.
 */
const WEIGHTS = { name: 32, keywords: 30, description: 14, paths: 14, verbs: 10 } as const;

const LIFE_CYCLE_VERBS = new Set([
  'initiate', 'create', 'retrieve', 'read', 'update', 'modify', 'control',
  'execute', 'cancel', 'delete', 'capture', 'evaluate', 'register', 'exchange',
  'authenticate', 'authorize',
]);

/** Generic CRUD verbs every BIAN domain implements: no domain signal. */
const GENERIC_VERBS = new Set(['retrieve', 'update', 'create', 'delete', 'read']);

function apiCorpus(api: ApiInput) {
  const name = termSet(`${api.name} ${api.baseUrl ?? ''}`);
  const descBits = [api.description ?? ''];
  const pathBits: string[] = [];
  const verbBits: string[] = [];
  for (const op of api.operations) {
    descBits.push(op.summary ?? '', op.description ?? '');
    pathBits.push(op.path);
    for (const v of tokenize(op.summary)) {
      if (LIFE_CYCLE_VERBS.has(v)) verbBits.push(v);
    }
  }
  const desc = termSet(descBits.join(' '));
  const paths = termSet(pathBits.join(' '));
  const verbs = new Set([...termSet(verbBits.join(' '))].filter((v) => !GENERIC_VERBS.has(v)));
  const all = new Set<string>([...name, ...desc, ...paths]);
  return { name, desc, paths, verbs, all };
}

function domainCorpus(d: ServiceDomainProfile) {
  const name = termSet(d.name);
  const desc = termSet(d.description);
  const keywords = termSet((d.keywords ?? []).join(' '));
  const opBits = (d.operations ?? []).map((o) => `${o.path} ${o.operationId} ${o.summary}`).join(' ');
  const opTerms = termSet(opBits);
  return {
    name, desc, keywords,
    paths: opTerms,
    verbs: new Set([...opTerms].filter((t) => LIFE_CYCLE_VERBS.has(t) && !GENERIC_VERBS.has(t))),
  };
}

/** Smoothed IDF weights in (0,1] over the domain catalog corpora. */
function idfWeights(domains: ServiceDomainProfile[]): { idf: Map<string, number>; vocab: Set<string> } {
  const df = new Map<string, number>();
  const vocab = new Set<string>();
  for (const d of domains) {
    const c = domainCorpus(d);
    const terms = new Set([...c.name, ...c.desc, ...c.keywords, ...c.paths]);
    for (const t of terms) {
      vocab.add(t);
      df.set(t, (df.get(t) ?? 0) + 1);
    }
  }
  const n = Math.max(1, domains.length);
  const idf = new Map<string, number>();
  for (const [t, f] of df) {
    idf.set(t, Math.log(1 + n / f) / Math.log(1 + n));
  }
  return { idf, vocab };
}

function weightedRecall(needles: Set<string>, haystack: Set<string>, idf: Map<string, number>, vocab?: Set<string>): { score: number; hits: string[] } {
  let num = 0;
  let den = 0;
  const hits: string[] = [];
  for (const t of needles) {
    if (vocab && !vocab.has(t)) continue;
    const w = idf.get(t) ?? 1;
    den += w;
    if (haystack.has(t)) { num += w; hits.push(t); }
  }
  hits.sort((a, b) => (idf.get(b) ?? 0) - (idf.get(a) ?? 0));
  return { score: den === 0 ? 0 : num / den, hits };
}

export function confidenceFor(score: number): Confidence {
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

export function scoreApi(api: ApiInput, domains: ServiceDomainProfile[], options: ScoreOptions = {}): Recommendation[] {
  const { topN = 5, minScore = 0 } = options;
  const a = apiCorpus(api);
  const { idf, vocab } = idfWeights(domains);
  const out: Recommendation[] = [];
  for (const d of domains) {
    const c = domainCorpus(d);
    const domainText = new Set([...c.name, ...c.desc, ...c.keywords, ...c.paths]);
    const nameR = weightedRecall(c.name, a.all, idf, vocab);
    const descR = weightedRecall(a.desc, domainText, idf, vocab);
    const kwR = weightedRecall(a.all, c.keywords, idf, vocab);
    const pathR = weightedRecall(a.paths, c.paths, idf, vocab);
    const verbR = weightedRecall(a.verbs, c.verbs, idf, vocab);
    const raw =
      nameR.score * WEIGHTS.name +
      descR.score * WEIGHTS.description +
      Math.min(kwR.score * 1.5, 1) * WEIGHTS.keywords +
      pathR.score * WEIGHTS.paths +
      Math.min(verbR.score, 1) * WEIGHTS.verbs;
    const score = Math.round(Math.min(100, Math.max(0, raw)));
    if (score < minScore) continue;
    const reasons: string[] = [];
    if (nameR.hits.length > 0) reasons.push(`name overlap: ${nameR.hits.slice(0, 4).join(', ')}`);
    if (kwR.hits.length > 0) reasons.push(`keyword hits (${kwR.hits.length}): ${kwR.hits.slice(0, 6).join(', ')}`);
    if (verbR.hits.length > 0) reasons.push(`operation verbs: ${verbR.hits.slice(0, 4).join(', ')}`);
    if (descR.score > 0 && kwR.hits.length === 0) reasons.push('description terms overlap');
    out.push({ domainId: d.id, domainName: d.name, businessArea: d.businessArea, score, confidence: confidenceFor(score), reasons, matchedKeywords: kwR.hits.slice(0, 12) });
  }
  out.sort((x, y) => y.score - x.score || x.domainName.localeCompare(y.domainName));
  return out.slice(0, Math.max(1, topN));
}
