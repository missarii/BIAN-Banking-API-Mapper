# The alignment engine

`packages/mapping-engine` is a pure-TypeScript, zero-dependency package. No
database, no network, no API key. Given an API and a domain catalog it
returns ranked candidates; given a set of APIs it finds overlaps; given
accepted mappings it computes coverage.

```
API description ──► tokenise ──► IDF-weighted recall ──► weighted sum ──► 0..100
                        │                                                     │
                        └────────────► reasons[] + matchedKeywords[] ──────────┘
```

## 1. Why not plain keyword matching, and why not an LLM

Plain `contains("payment")` scoring fails immediately in both directions:

* **False positives.** Every BIAN domain description mentions *customer*,
  *currency*, *channel* and *transaction*. A bag-of-words overlap between a
  small API and a 200-word domain description is dominated by that filler.
* **Length asymmetry.** The bank API has ~15 tokens; a domain corpus has
  ~200. Jaccard (intersection ÷ union) collapses toward zero for the
  *correct* domain simply because the domain is verbose.

An LLM would fix the semantics but breaks the constraints that matter for
this POC: it needs a key, it is non-deterministic (so the same import gives
different scores in a demo), it costs money per call, and it cannot be unit
tested. AI is therefore **deliberately deferred** — see §6.

## 2. Pipeline

### Step 1 — Normalise (`normalize.ts`)

* Split camelCase/PascalCase and strip `{template}` path params, so
  `/payments/{id}` → `payment` (not `pay`,`id`).
* Lowercase, split on non-letters.
* Drop stopwords, including a BIAN-specific list (`currency`, `channel`,
  `device`, `service`, `data`, …) that would otherwise inflate every score.
* Light deterministic stemmer: `transactions → transaction`,
  `accounts → account`. Deliberately *not* a Porter stemmer — the rules are
  short, auditable and unit-tested.

### Step 2 — Build corpora (`scoring.ts`)

Per API, five term sets: `name`, `desc`, `paths`, `verbs`, `all`.
Per domain, five term sets: `name`, `desc`, `keywords`, `paths`, `verbs`.

**Operation verbs** are a real BIAN signal: `Initiate`/`Execute`/`Control`
are Service Operation types, while `Retrieve`/`Update`/`Create`/`Delete`
are generic CRUD that every domain has — so generic verbs are stripped
before scoring. Otherwise *every* domain matches an API that has a `GET`.

### Step 3 — IDF weighting (`idfWeights`)

A term's weight is `log(1 + N/df) / log(1 + N)` ∈ (0, 1], where `df` is the
number of domains containing it. So:

| term           | appears in | weight | effect                    |
| -------------- | ---------- | ------ | ------------------------- |
| `payment`      | many       | low    | weak evidence             |
| `mortgage`     | 2          | high   | strong evidence           |
| `disbursement` | 1          | ~1.0   | strong, specific evidence |

This is what makes the engine behave like an architect rather than a regex.

### Step 4 — Recall, not Jaccard (`weightedRecall`)

For each signal we compute *how much of the weighted needle set is covered*:
`Σ(idf of matched terms) / Σ(idf of all terms)`. The needle side is always
the smaller, more meaningful set. Terms outside the BIAN vocabulary are
skipped entirely — a bank API calling something `cust_ref_v2` is never
*penalised* for using non-BIAN language; it simply does not earn points.

### Step 5 — Weighted sum

```ts
score = nameR*32 + min(kwR*1.5,1)*30 + descR*14 + pathR*14 + min(verbR,1)*10
```

clamped to `0..100` and rounded. The weights are one `const` object at the
top of `scoring.ts`, so tuning is a one-line change.

### Step 6 — Confidence bands

| score  | band   | meaning for the architect        |
| ------ | ------ | -------------------------------- |
| >= 70  | HIGH   | accept in one click              |
| 40–69  | MEDIUM | inspect the reasons, then decide |
| < 40   | LOW    | probably a different boundary    |

### Step 7 — Explainability

Every recommendation carries `reasons[]` (e.g.
`name overlap: payment`, `keyword hits (5): initiate, order, payment…`)
and `matchedKeywords[]`. **An architect must never be asked to accept a
number they cannot interrogate.** This is also what makes the demo land:
the UI shows *why*, not just *what*.

## 3. Duplicate detection (`duplicates.ts`)

Pairwise term-set similarity over name + description + paths + summaries,
with a name-token boost so `/customer/profile` and `/customer/details`
still cluster when their prose is thin. It returns pairs above a threshold
for **human review** — the tool never auto-merges. Output is framed as
"potentially overlapping", because deciding that two capabilities are the
same is an organisational question, not a lexical one.

## 4. Coverage metrics (`coverage.ts`)

Pure arithmetic over *accepted* mappings only: mapped/unmapped counts,
coverage %, HIGH/MEDIUM/LOW distribution, and per-business-area coverage.
Candidate and rejected mappings deliberately do not count — otherwise the
dashboard would flatter itself.

## 5. Testing

`pnpm --filter @bian/mapping-engine test` runs Vitest against:

* **Synthetic fixtures** (`scoring.test.ts`, `coverage.test.ts`) — the
  ranking contract: a payments API must beat the customer domain, scores
  stay in `0..100`, `topN` is honoured, empty input yields no `NaN`.
* **The real seeded catalogue** (`real-seed.test.ts`) — loads the 40 BIAN
  14.0 domains from `seed/` and asserts that realistic bank APIs (payments,
  customer, accounts, cards, loans) rank a domain from the expected family
  first. This is the test that catches "the engine only works on my three
  hand-written examples".

## 6. Deferred: semantic mapping

The interface is ready for it. `scoreApi()` is the only entry point, and
`Recommendation` already carries `score` / `confidence` / `reasons`.
Adding embeddings means: load a local model (`sentence-transformers`, or
`@xenova/transformers` to stay in TypeScript), embed `name + description`
per API and per domain, then blend cosine similarity with the lexical score
(e.g. `0.6 x semantic + 0.4 x lexical`). Local model, no key, deterministic
per model version, still unit-testable.

It is left out because the lexical engine already produces defensible
rankings, and shipping a working deterministic tool beats shipping a
half-configured AI feature.

## 7. Honest limitations

* It scores **vocabulary overlap**, not intent. An API described only as
  "does the thing" maps to nothing useful — as it should.
* The verb signal is coarse: it cannot distinguish `Execute` from
  `Initiate`.
* IDF is computed over the 40-domain demo slice; over all 259 domains the
  weights would shift (for the better) with no code change.
* Scores are relational, not absolute. "72%" means *this candidate beat the
  others on these signals*, not "72% correct".
