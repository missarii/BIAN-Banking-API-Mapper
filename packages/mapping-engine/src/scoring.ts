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
