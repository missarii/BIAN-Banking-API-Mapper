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
