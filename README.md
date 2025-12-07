# BIAN Banking API Mapper

**A BIAN-aligned architecture analysis tool that maps an enterprise's existing REST APIs to BIAN Service Domains, detects overlapping capabilities, and visualises how banking functionality could be reorganised into standardised service boundaries.**

Built as a developer/architect tool — not a banking application.

[![tests](https://img.shields.io/badge/tests-33%20passing-brightgreen)](#testing)
[![build](https://img.shields.io/badge/build-api%20%2B%20web%20clean-brightgreen)](#quickstart)
[![BIAN](https://img.shields.io/badge/BIAN%20Service%20Landscape-14.0.0-blue)](#bian-grounding--data-provenance)
[![licence](https://img.shields.io/badge/licence-MIT-lightgrey)](#licence--attribution)

> **This is an independent proof-of-concept.** It is **not** affiliated with,
> endorsed by, or certified by BIAN. Every score, percentage and confidence
> band shown is this tool's own analytical metric — never a BIAN
> certification, conformance score, or compliance measure.
> See [BIAN: what it is and why this project uses it](#bian-what-it-is-and-why-this-project-uses-it).

---

## Table of contents

- [Purpose — the problem this solves](#purpose--the-problem-this-solves)
- [BIAN: what it is and why this project uses it](#bian-what-it-is-and-why-this-project-uses-it)
- [What the tool actually does](#what-the-tool-actually-does)
- [Features](#features)
- [How it works](#how-it-works)
- [Tech stack](#tech-stack)
- [Architecture & project layout](#architecture--project-layout)
- [Quickstart](#quickstart)
- [Demo walkthrough](#demo-walkthrough)
- [API reference](#api-reference)
- [BIAN grounding & data provenance](#bian-grounding--data-provenance)
- [Testing](#testing)
- [Scope: what this deliberately is not](#scope-what-this-deliberately-is-not)
- [Limitations](#limitations)
- [Licence & attribution](#licence--attribution)

---

## Purpose — the problem this solves

A mid-size bank accumulates hundreds of APIs. Each team builds its own, in
its own vocabulary, on its own timeline:

```
Customer Team  ──►  customer-service
Account Team   ──►  account-management
Payment Team   ──►  payments-v2
Legacy Team    ──►  customer-data-service     ◄── overlaps with the first
```

Responsibilities drift and collide. Nobody can answer, quickly:

- *Which business capability does this API actually belong to?*
- *Are two teams maintaining the same boundary under different names?*
- *Where are our genuine gaps against a reference landscape?*
- *If we had to draw the target architecture tomorrow, what would it look like?*

BIAN describes the destination — stable, capability-based service
boundaries. It does not tell you how to get **your** existing estate there.

**This tool is the bridge.** It takes the APIs a bank already has and answers
*"which BIAN Service Domain does this most closely align with?"* — with the
evidence, a confidence band, and a human decision at the end of it.

### Who it is for

| Role | What they get out of it |
| --- | --- |
| **Enterprise architect** | A defensible mapping from the current estate to a reference landscape, plus a target-state graph to argue from |
| **Domain / tech lead** | Visibility into whether their API overlaps with another team's, and where the real boundary sits |
| **Integration team** | A catalogue of canonical boundaries instead of re-inventing naming per project |
| **New joiner** | A navigable, searchable tour of what the bank's banking capabilities actually are |

---

## BIAN: what it is and why this project uses it

### The organisation

**BIAN** stands for the **Banking Industry Architecture Network** — a
not-for-profit standards body founded in 2008 by banks, software vendors and
systems integrators. Its members are banks and technology providers who got
tired of every bank and every core-banking product describing the same
banking capabilities with different names, different boundaries and
different interfaces.

BIAN publishes a **reference architecture** for banking. It is not a product,
not a framework you install, and not a bank in a box. It is a shared
vocabulary and a target structure.

### The core idea

Traditional bank architecture is organised around **applications** —
`customer-service`, `payments-v2`, the mainframe. BIAN organises the bank
around **business capability**:

| BIAN concept | Meaning | Example |
| --- | --- | --- |
| **Service Domain** | A discrete partition of business capability — *what* the bank does | `Current Account`, `Payment Order Initiation` |
| **Control Record** | The single thing that Service Domain manages the lifecycle of | `PaymentOrderInitiationTransaction` |
| **Service Operation** | The standard API shape every domain exposes | `Initiate`, `Retrieve`, `Update`, `Control`, `Execute`, `Evaluate` |
| **Behavior Qualifier (BQ)** | A sub-facet of the same capability | `Compliance`, `Confirmation`, `OrderInitiation` |
| **Service Landscape** | The reference structure that organises all Service Domains | the catalogue this tool ships |
| **Semantic API** | The standard interface definition for a Service Domain | the artifact each catalogue entry is generated from |

A Service Domain is emphatically **not a process step**. It is a stable
boundary that survives whatever process happens to run across it this year.
That stability is the entire value proposition: interfaces defined by
capability rather than by whoever implemented them.

### Why this project uses BIAN

1. **It solves a real organisational problem.** Overlapping, inconsistently
   named APIs are a genuine enterprise pathology, and BIAN exists precisely
   to address it. The tool operationalises that idea rather than inventing
   its own taxonomy.
2. **It gives the tool a defensible, external reference.** Instead of
   "these are the buckets I chose", the catalogue is generated from BIAN's
   published artifacts. An architect can check the names.
3. **It makes the architecture conversation possible.** Once an API is
   bound to a Service Domain, questions like *"is this boundary too broad?"*
   or *"why do two teams both own customer data?"* become askable, because
   there is shared vocabulary to ask them in.

### What is borrowed, and what is ours

Being precise here matters — the tool is only credible if it does not blur
the line between BIAN's material and its own analysis:

| Element | Source |
| --- | --- |
| Service Domain names | **BIAN 14.0.0**, verbatim from `info.title` |
| Domain purposes | **BIAN 14.0.0**, verbatim from `info.description` |
| Service Operations (method, path, summary) | **BIAN 14.0.0**, verbatim from the OpenAPI `paths` |
| Control Record, Behavior Qualifiers | **BIAN 14.0.0**, from the `CR -` / `BQ -` tags |
| Business-area grouping (Customer, Payments, …) | **Curated for this demo** — BIAN's own landscape grouping is richer |
| Dependency edges between domains | **Curated for the graph demo** — illustrative, not official BIAN relations |
| Alignment scores, confidence bands, coverage %, duplicate similarity | **This tool's analysis** — not BIAN metrics |

---

## What the tool actually does

```
   Import (OpenAPI) or register manually
                 │
                 ▼
   ┌─────────────────────────────┐
   │  Internal API Registry      │   API ──► operations (method + path + prose)
   └──────────────┬──────────────┘
                  ▼
   ┌─────────────────────────────┐
   │  Alignment Engine           │   deterministic · explainable · no API key
   │  (packages/mapping-engine)  │
   └──────────────┬──────────────┘
                  ▼
   Ranked Service Domain candidates  +  the reasons for each one
                  │
                  ▼
   ┌─────────────────────────────┐
   │  Architect review           │   Accept · Reject · Change to another domain
   │  (human in the loop)        │   ── audit-trailed
   └──────────────┬──────────────┘
                  ▼
   ┌──────────────┴──────────────┐
   ▼                             ▼
  Alignment Dashboard          Architecture Graph
  coverage · confidence        API ──► Service Domain ──► dependencies
  mix · overlaps
```

The tool never claims to make the decision. **The engine proposes; the
architect disposes.** Only *accepted* mappings count towards the dashboard
and the graph, so the reported state always reflects human judgement.

---

## Features

### 1. Command palette — the BIAN Service Domain catalogue
Searchable, filterable catalogue of the reference landscape. Each entry
shows the domain name, its business area, and its stated purpose. Filter by
area to sweep a slice of the landscape at a time.

### 2. Service Domain detail
For any domain: its verbatim BIAN purpose, its **Control Record**, its
**Behavior Qualifier** tags, every **Service Operation** with the real BIAN
path (including the `InCR` / `UpCR` / `ReCR` / `ReBQ` operation prefixes),
its dependencies, and the internal APIs currently mapped to it.

### 3. Internal API Registry
Register the APIs a bank actually owns — name, base URL, version, protocol,
owning team, description, and the operations under it. Create by hand or
import from OpenAPI (feature 7).

### 4. Alignment engine — the core
The heart of the project. Given an API, rank the Service Domains it aligns
with and explain every score. Deterministic, dependency-free TypeScript, no
API key, unit-testable. See [How it works](#how-it-works).

### 5. Human-in-the-loop review
The architect can **Accept**, **Reject**, or **Change** a recommendation to a
different domain. Every decision is written to an audit trail with the
reviewer's identity, the decision, and an optional comment.

Backed by a real invariant: accepting a domain **demotes every other
accepted mapping for that API**, so one API can never be reported as cleanly
aligned to two domains at once.

### 6. Alignment dashboard
Coverage (mapped / unmapped), HIGH/MEDIUM/LOW confidence mix, per-business-area
coverage bars, the list of APIs still needing attention, and flagged overlaps
— all derived from accepted mappings only.

### 7. OpenAPI import
Upload an OpenAPI 3.x or Swagger 2 document as YAML or JSON. The tool parses
it, extracts every `path × method` with its summary and description, creates
the API and its operations, and the record is immediately ready to analyse.
`samples/banking-api.yaml` (13 endpoints) is included for the demo.

### 8. Duplicate / overlap detection
Pairwise similarity across names, descriptions, paths and summaries, with a
name-token boost so `/customer/profile` and `/customer/details` still
cluster when their prose is thin. Returns *potentially* overlapping pairs for
human review — it never auto-merges, because deciding two capabilities are
the same is an organisational question, not a lexical one.

### 9. Architecture graph
Interactive React Flow view of the resulting architecture: **API → Service
Domain** (accepted mappings) and **Service Domain → Service Domain**
(dependencies). Filterable by business area. This is the picture you draw on
a whiteboard — rendered from data.

### 10. OpenAPI documentation of the backend itself
`/swagger` documents every endpoint, so the tool is as inspectable as the
APIs it analyses.

---

## How it works

### The problem with naive scoring

Scoring an API against a domain by keyword overlap fails in both directions:

- **False positives.** Every BIAN domain description mentions *customer*,
  *currency*, *channel*, *transaction*. Those shared terms dominate any
  bag-of-words comparison and drown the signal that actually matters.
- **Length asymmetry.** A bank API has ~15 meaningful tokens; a domain
  corpus has ~200. Jaccard (intersection ÷ union) collapses toward zero for
  the *correct* domain simply because the domain is verbose.

The fix is to measure **how much of the small, distinctive side each domain
explains**, and to weight rare terms far more heavily than ubiquitous ones.

### The pipeline

```
API name + description + operations
            │
            ▼
 (1) Normalise        camelCase split · {template} params dropped ·
                      stopwords removed · light stemming
            │
            ▼
 (2) Build corpora    five term-sets per API and per domain:
                      name · description · paths · verbs · all
            │
            ▼
 (3) IDF weight       log(1 + N/df) — rare terms count more
            │
            ▼
 (4) Weighted recall  Σ(idf of matched) / Σ(idf of all), per signal
            │
            ▼
 (5) Weighted sum     name×32 + keywords×30 + description×14
                      + paths×14 + verbs×10  →  clamp 0..100
            │
            ▼
 (6) Confidence       ≥70 HIGH · 40–69 MEDIUM · <40 LOW
            │
            ▼
 (7) Explain          reasons[] + matchedKeywords[] for every candidate
```

**Step 1 — Normalise.** `POST /payments/{id}` splits into `payment`, not
`pay` + `id`. A small auditable stemmer maps `transactions → transaction`,
`accounts → account`. A BIAN-specific stopword list removes the filler
(`currency`, `channel`, `device`, `service`, `data`) that inflates every score.

**Step 3 — IDF weighting.** A term's weight is `log(1 + N/df) / log(1 + N)`
where `df` is how many domains contain it:

| term | appears in | weight | effect |
| --- | --- | --- | --- |
| `payment` | many domains | low | weak evidence |
| `mortgage` | 2 domains | high | strong evidence |
| `disbursement` | 1 domain | ~1.0 | strong, specific evidence |

This is what makes the engine behave like an architect rather than a regex.

**Step 4 — Recall, not Jaccard.** The needle side is always the smaller,
more meaningful set. Crucially, terms *outside* the BIAN vocabulary are
skipped entirely — a bank API calling something `cust_ref_v2` is never
**penalised** for using non-BIAN language; it simply earns no points.

**Step 2 detail — operation verbs are a real BIAN signal.** BIAN's Service
Operation types (`Initiate`, `Execute`, `Control`, `Evaluate`) are
distinctive, whereas `Retrieve`/`Update`/`Create`/`Delete` are generic CRUD
every domain implements. Generic verbs are stripped before scoring —
otherwise *every* domain would match any API that happens to have a `GET`.

**Step 7 — Explainability is non-negotiable.** An architect must never be
asked to accept a number they cannot interrogate. Every candidate ships with
the evidence that produced it, e.g.:

```
Payment Order Initiation  75%  HIGH
  name overlap: order, payment
  keyword hits (6): order, payment, customer, transaction, initiate, retrieve
```

### Why no LLM (yet)

An LLM would improve the semantics but breaks the constraints that actually
matter here: it needs an API key, it is non-deterministic (so the same import
would score differently in front of an audience), it costs money per call,
and it cannot be unit-tested. The engine is therefore deterministic and
offline by design.

The interface is ready for it though: `scoreApi()` is the single entry point
and `Recommendation` already carries `score`, `confidence` and `reasons`.
Adding local embeddings (`@xenova/transformers`, or `sentence-transformers`)
and blending `0.6 × semantic + 0.4 × lexical` is a contained change with no
API key required. Details in [`docs/mapping.md`](docs/mapping.md).

---

## Tech stack

### Frontend

| Technology | Version | Role |
| --- | --- | --- |
| **React** | 18 | UI library. Hooks + function components only |
| **TypeScript** | 5.6 | Type safety across the whole stack, including the engine |
| **Vite** | 5 | Dev server and production bundler |
| **Tailwind CSS** | 3.4 | Styling. Utility-first, no separate CSS architecture to maintain |
| **TanStack React Query** | 5 | Server-state caching. The server is the source of truth — no client store |
| **React Flow** | 11 | Interactive architecture graph (nodes, edges, mini-map, controls) |
| **React Router** | 6 | Eight routes, client-side |

### Backend

| Technology | Version | Role |
| --- | --- | --- |
| **NestJS** | 10 | Modular structure. Each domain concern is its own module with explicit boundaries |
| **TypeScript** | 5.6 | Shared language with the frontend and the engine |
| **Prisma** | 5 | Typed ORM, schema-first migrations, seeding |
| **PostgreSQL** | 16 | Primary datastore |
| **Passport + JWT** | 10 / 0.7 | Minimal auth with `ADMIN` / `ARCHITECT` / `VIEWER` roles |
| **class-validator** | 0.14 | DTO validation on every write endpoint |
| **js-yaml** | 4 | OpenAPI YAML parsing |
| **Swagger / OpenAPI** | `@nestjs/swagger` | Live API documentation at `/swagger` |

### Alignment engine

| Technology | Role |
| --- | --- |
| **Pure TypeScript** | Zero runtime dependencies — no database, no network, no API key |
| **Vitest** | Unit tests, including assertions against the real BIAN catalogue |

### Infrastructure

| Technology | Role |
| --- | --- |
| **Docker Compose** | PostgreSQL 16 on host port **5433** (avoids clashing with a local 5432) |
| **pnpm workspaces** | Monorepo: two apps + one shared package |
| **Python 3 (stdlib only)** | One-off seed generator that pulls BIAN artifacts |

### Deliberately not included

Redis, Kafka, Kubernetes, cloud IaC, a message queue, a second datastore.
Every one of them would be resume-driven development here — the workload is
synchronous and single-node by nature. Stating this is part of the design.

---

## Architecture & project layout

```
                    ┌──────────────────────┐
                    │      Architect       │
                    └───────────┬──────────┘
                                │ browser
                    ┌───────────▼──────────┐
                    │   apps/web  (React)  │
                    │  Vite · TS · Tailwind│
                    │  React Query · Flow  │
                    └───────────┬──────────┘
                                │ REST /api/v1 (JSON)
                    ┌───────────▼──────────┐
                    │   apps/api (NestJS)  │
                    │  Swagger at /swagger │
                    └───┬────────┬─────────┘
                        │        │
       Prisma Client    │        │  in-process import
                        │        │
            ┌───────────▼──┐  ┌──▼─────────────────────────┐
            │ PostgreSQL 16│  │ @bian/mapping-engine (pure)│
            │  Service     │  │  scoring · duplicates      │
            │  Domains     │  │  coverage                  │
            │  APIs / ops  │  └────────────────────────────┘
            │  Mappings    │
            │  Deps/Reviews│
            └──────────────┘
```

```
bian-banking-api-mapper/
├── apps/
│   ├── api/                        NestJS + Prisma + Swagger
│   │   ├── prisma/
│   │   │   ├── schema.prisma       data model
│   │   │   ├── seed.ts             BIAN catalogue + users + sample APIs
│   │   │   └── migrations/
│   │   └── src/
│   │       ├── auth/               JWT strategy, roles guard
│   │       ├── service-domains/    read API over the BIAN catalogue
│   │       ├── apis/               internal API registry (CRUD)
│   │       ├── mappings/           analyze + review   ◄── the core
│   │       ├── import/             OpenAPI 3.x / Swagger 2 parser
│   │       ├── architecture/       graph nodes + edges
│   │       ├── dashboard/          coverage + duplicates
│   │       └── prisma/             PrismaService
│   └── web/                        React SPA (8 routes)
│       └── src/
│           ├── components/         Layout, nav
│           ├── lib/api.ts          typed fetch wrapper
│           └── pages/              Dashboard, Domains, DomainDetail,
│                                   Apis, ApiDetail, Mapping, Architecture
├── packages/
│   └── mapping-engine/             pure TS engine + Vitest suites
│       └── src/
│           ├── normalize.ts        tokenise · stem · stopwords
│           ├── scoring.ts          IDF weighting + weighted recall
│           ├── duplicates.ts       pairwise overlap detection
│           ├── coverage.ts         dashboard metrics
│           └── __tests__/          synthetic + real-catalogue tests
├── scripts/build_seed.py           BIAN 14.0 artifacts → seed JSON
├── seed/bian-service-domains.json  generated catalogue (committed)
├── samples/banking-api.yaml        demo OpenAPI import (13 endpoints)
├── docs/                           bian.md · architecture.md · mapping.md
└── docker-compose.yml              PostgreSQL 16
```

### Design decisions worth naming

- **The engine is a package, not a service.** It has no I/O. That is what
  makes it unit-testable, reusable from a CLI or batch job, and impossible
  to accidentally couple to Prisma. The API is a thin adapter over it.
- **Modular monolith, not microservices.** One deployable with clear module
  boundaries is right for a POC — and each module could be extracted later
  if the boundaries proved wrong, which is exactly the argument the tool
  makes about banking APIs.
- **The review step is a real gate.** `CANDIDATE` mappings never reach the
  dashboard or the graph. Only `ACCEPTED` does, so reported state always
  reflects a human decision.
- **`Mapping` is unique on `(apiId, serviceDomainId)`** so re-analysing is an
  idempotent upsert rather than a duplicating insert.

---

## Quickstart

**Prerequisites:** Node 20+, pnpm, Docker.

```bash
# 1 ─ install workspace dependencies
pnpm install

# 2 ─ start PostgreSQL 16 (host port 5433)
pnpm db:up

# 3 ─ configure environment
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 4 ─ create the schema, then load the real BIAN catalogue + demo data
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed

# 5 ─ run (two terminals)
pnpm --filter @bian/api start:dev     # → http://localhost:3000   (/swagger)
pnpm --filter @bian/web dev           # → http://localhost:5173
```

Open **http://localhost:5173**.

### Seeded demo accounts (POC only — change in any shared environment)

| Email | Password | Role |
| --- | --- | --- |
| `architect@bank.example` | `architect123` | ARCHITECT |
| `admin@bank.example` | `admin12345` | ADMIN |
| `viewer@bank.example` | `viewer1234` | VIEWER |

### What gets seeded

- **40 BIAN 14.0.0 Service Domains** across 11 business areas, with real
  purposes, Control Records, Behavior Qualifiers and Service Operations
- **61 dependency edges** between domains (curated, for the graph)
- **3 demo users** across the three roles
- **5 sample internal APIs**, including a deliberate overlap pair so the
  duplicate detector has something real to find on a fresh install
- **3 accepted mappings with an audit trail** — seeding runs the real engine
  over the sample estate and records its top candidate as an architect
  decision, so the dashboard, coverage metrics and graph are populated the
  moment you open them. The two legacy overlap APIs stay deliberately
  unmapped, so there is always something left for you to do.

### Handy commands

```bash
pnpm test              # engine test suites
pnpm build             # build every workspace package
pnpm seed:build        # regenerate the catalogue from BIAN artifacts
pnpm db:down           # stop PostgreSQL
```

---

## Demo walkthrough

A ~5 minute path through the tool. Every number below is real output from
this build.

### 1 — The dashboard

Start at `/`. On a fresh seed, three of the five APIs are already mapped by
the demo architect — coverage **60%**, alignment **67%** — and the two legacy
overlap APIs sit unmapped in the list below.

> *"This is an architecture tool. It answers one question: given the APIs a
> bank already has, which BIAN Service Domains do they actually belong to?"*

### 2 — Import an OpenAPI document

Go to `/apis` → an OpenAPI document is uploaded. Point at
`samples/banking-api.yaml` — **13 endpoints** are parsed into an API with its
operations, in one request.

> *"This is the realistic entry point — nobody hand-types 200 APIs."*

### 3 — Look at the BIAN catalogue

Go to `/service-domains`, search `payment`, open **Payment Order Initiation**.

The page shows the verbatim BIAN purpose, the Control Record
`PaymentOrderInitiationTransaction`, Behavior Qualifiers (`Compliance`,
`Confirmation`, `OrderInitiation`), and its Service Operations with real BIAN
paths:

```
POST  /PaymentOrderInitiation/Initiate                                                     InCR
PUT   /PaymentOrderInitiation/{paymentorderinitiationid}/Update                            UpCR
GET   /PaymentOrderInitiation/{paymentorderinitiationid}/Retrieve                          ReCR
GET   /PaymentOrderInitiation/{paymentorderinitiationid}/Compliance/{complianceid}/Retrieve ReBQ
```

> *"This isn't invented terminology — it's generated from BIAN's published
> 14.0 artifacts."*

### 4 — Run the alignment engine

Go to `/mapping`, pick **Payment API**, press **Analyze mapping**. The API's
prose is *"Initiate and execute a customer payment"* — it contains no BIAN
vocabulary at all. Result:

```
Payment API
  POST /payments             "Initiate and execute a customer payment"
  GET  /payments/{id}        "Retrieve payment order status"
  POST /payments/{id}/cancel "Cancel a pending payment order"

HIGH    Payment Order Initiation   75%   name overlap: order, payment
                                          keyword hits (6): order, payment, customer,
                                                            transaction, initiate, retrieve
HIGH    Standing Order             75%
MEDIUM  Payment Rail               58%
MEDIUM  Servicing Order            54%
MEDIUM  Direct Debit               44%
```

More real examples from the seeded estate:

| API | Top candidate | Score | Band |
| --- | --- | --- | --- |
| Customer Management API | Party Reference Data Directory | 87% | HIGH |
| Payment API | Payment Order Initiation | 75% | HIGH |
| Account API | Current Account | 49% | MEDIUM |
| Retail Banking Channel API *(13 mixed endpoints)* | Current Account | 52% | MEDIUM |

Note the last row: a 13-endpoint channel API correctly produces a **spread**
of MEDIUM candidates rather than one confident answer. That is itself the
finding — *this API spans multiple boundaries and should be split.* The tool
surfaces that instead of hiding it behind a single number.

### 5 — Review the recommendation

The architect presses **Accept**. The mapping becomes `ACCEPTED`, an audit
row records who decided it and why, and the dashboard and graph update from
that one action.

> *"The engine proposes candidates. The architect makes the architectural
> decision. That split is deliberate — a tool should not be allowed to
> silently redefine an organisation's service boundaries."*

### 6 — Overlap detection

Back on the dashboard:

```
Potentially overlapping APIs
  Customer Profile API  ↔  Customer Details API      89%
    shared: customer, profile, detail, maintained, legacy, platform
  Customer Management API  ↔  Customer Profile API   45%
  Customer Management API  ↔  Customer Details API   37%
```

> *"Three APIs, one capability, two teams. This is the exact problem BIAN
> Service Domains exist to prevent — and here it is, visible. The tool
> doesn't merge them; it tells an architect where to look."*

### 7 — The architecture graph

Go to `/architecture`. React Flow renders **43 nodes and 64 edges** on a fresh
install: **40 Service Domains**, **3 internal APIs** (only APIs with an
accepted mapping surface as nodes) and **61 domain-to-domain dependencies**.
Filter by `Payments` to isolate a slice.

> *"The tool doesn't just rename APIs. It shows the boundaries and the
> relationships between capabilities — which is the part that actually helps
> an architect."*

---

## API reference

Base path `/api/v1`. Full interactive docs at **`/swagger`**.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | – | Exchange credentials for a JWT |
| `GET` | `/service-domains` | – | List / search / filter the catalogue (`?search=`, `?area=`) |
| `GET` | `/service-domains/areas` | – | Business-area facet counts |
| `GET` | `/service-domains/:idOrSlug` | – | Purpose, Control Record, BQs, Service Operations, dependencies, mapped APIs |
| `GET` | `/apis` | – | List registered APIs (`?search=`) |
| `POST` | `/apis` | – | Register an API with its operations |
| `GET` | `/apis/:id` | – | API detail: operations + all mappings |
| `DELETE` | `/apis/:id` | – | Remove an API |
| `POST` | `/mappings/analyze` | – | **Run the engine**, persist candidates |
| `POST` | `/mappings/review` | **JWT** (`ADMIN`/`ARCHITECT`) | Accept / reject / change a mapping |
| `GET` | `/mappings/api/:apiId` | – | All mappings for one API |
| `POST` | `/import/openapi` | – | Multipart OpenAPI 3.x / Swagger 2 import |
| `GET` | `/architecture/graph` | – | Nodes + edges (`?area=`) |
| `GET` | `/dashboard` | – | Coverage, confidence mix, duplicates, unmapped |

### Example — analyze

```http
POST /api/v1/mappings/analyze
Content-Type: application/json

{ "apiId": "<api-id>", "topN": 5 }
```

```json
{
  "apiId": "<api-id>",
  "recommendations": [
    {
      "domainId": "<domain-id>",
      "domainName": "Payment Order Initiation",
      "businessArea": "Payments",
      "score": 75,
      "confidence": "HIGH",
      "matchedKeywords": ["order", "payment", "customer", "transaction", "initiate", "retrieve"],
      "reasons": [
        "name overlap: order, payment",
        "keyword hits (6): order, payment, customer, transaction, initiate, retrieve",
        "operation verbs: initiate, execute"
      ]
    }
  ]
}
```

### Example — review

```http
POST /api/v1/mappings/review
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "apiId": "<api-id>",
  "serviceDomainId": "<domain-id>",
  "decision": "ACCEPT",
  "comment": "Verified against the payments landscape."
}
```

Returns **401** without a valid token. `decision` is one of `ACCEPT`,
`REJECT`, `CHANGE` (the last requires `newServiceDomainId`).

---

## BIAN grounding & data provenance

`seed/bian-service-domains.json` is **generated, not hand-written**:

```bash
pnpm seed:build        # → python3 scripts/build_seed.py
```

The script pulls the official semantic API artifacts from
[`bian-official/public`](https://github.com/bian-official/public)
(BIAN Service Landscape **14.0.0**, Apache-2.0), under
`release14.0.0/semantic-apis/oas3 /yamls`, and extracts verbatim:

| Field in this project | BIAN source |
| --- | --- |
| `name` | `info.title` |
| `description` | `info.description` — the domain's stated purpose |
| `operations[]` | `paths` → method + `operationId` + `summary` |
| `controlRecord` | the `CR - <ControlRecord>` tag |
| `behaviorQualifiers[]` | the `BQ - <BehaviorQualifier>` tags |

### Version drift is real — and it is a deliberate design point

BIAN rationalises names between releases. Two examples that catch people who
learned BIAN from older articles:

- **"Payment Execution" no longer exists in 14.0.** The Payments area was
  reorganised around `PaymentOrderInitiation`, `PaymentRail`,
  `TransactionEngine`, `DirectDebit`, `StandingOrder`, `Disbursement` and
  `FinancialGateway`.
- **"Customer Profile" no longer exists either.** Customer capability now
  lives in `PartyReferenceDataDirectory`, `PartyLifecycleManagement`,
  `CustomerRelationshipManagement`, `CustomerPosition`, and others.

A catalogue copied from a blog post is wrong on arrival. Generating it from
the published release is what keeps this honest, and re-running
`pnpm seed:build` against a future release is the upgrade path.

### Catalogue size

BIAN 14.0 publishes **~259** semantic API artifacts. This POC ships a curated
**40-domain slice** chosen to cover a realistic retail/corporate demo across
11 business areas:

```
Customer 6 · Accounts 4 · Payments 7 · Cards 4 · Loans 4
Risk & Compliance 5 · Security & Access 2 · Products 3
Servicing 3 · Finance 1 · Treasury 1                            = 40
```

The design is release-agnostic: extending to the full landscape is a matter
of adding names to the `DOMAINS` list in `scripts/build_seed.py` and
re-running it.

Full write-up: [`docs/bian.md`](docs/bian.md)

---

## Testing

```bash
pnpm test                                              # all suites
pnpm --filter @bian/mapping-engine test                # engine only
pnpm --filter @bian/api test                           # API input contracts
```

**33 tests across 5 suites, all passing.**

| Suite | What it protects |
| --- | --- |
| `scoring.test.ts` | The ranking contract — a payments API must beat the customer domain, scores stay within `0..100`, `topN` is honoured, reasons are always produced |
| `coverage.test.ts` | Metric arithmetic — counts, percentages, per-area rows, and no `NaN` on empty input |
| `real-seed.test.ts` | **The important one.** Loads the actual 40-domain BIAN 14.0 catalogue and asserts that realistic bank APIs rank a domain from the expected family first |
| `mappings/dto.spec.ts` | The review API's input contract — `decision` must be `ACCEPT`/`REJECT`/`CHANGE`, `topN` stays inside 1..10, required ids are never empty |
| `auth/dto.spec.ts` | Login validation — email shape, the 8-character password floor, and missing fields |

The `decision` constraint matters more than it looks. `MappingsService.review`
treats *anything that is not `REJECT`* as an acceptance, so without `IsIn` a
caller posting `{"decision": "MAYBE"}` would silently flip a mapping to
`ACCEPTED`. The test exists to make that impossible.

`real-seed.test.ts` exists specifically to catch the failure mode where an
engine only works on the three examples its author wrote. Current output:

```
Payment API              → Payment Order Initiation          75
Customer Management API  → Party Reference Data Directory    70
Account API              → Current Account                   53
Card API                 → Card Transaction Capture          79
Loan Origination API     → Consumer Loan                     69
```

These come from the fixtures inside the test file, not from the database, so
they can differ by a few points from the same API on the seeded estate
(`Account API` is 53 here and 49 as seeded, because the fixture omits the
`baseUrl` and words an endpoint summary differently). What never changes is
the **rank-1 domain** — that is the property the assertion protects, and the
reason this suite is worth keeping.

What the unit suites deliberately do **not** cover is anything that needs
PostgreSQL. Those paths — analyze, review, import, dashboard, architecture
graph — are exercised end-to-end against a running stack instead. With the API
up on `:3000` after `pnpm prisma:seed`:

```bash
curl -s localhost:3000/api/v1/dashboard | python3 -m json.tool
```

A fresh install should report `totalApis: 5`, `mapped: 3`, `coveragePct: 60`,
`alignmentPct: 67` and `potentialDuplicates: 3`. If those numbers drift, either
the seed or the coverage arithmetic has changed — both are worth knowing about
before you demo it.

---

## Scope: what this deliberately is not

This is a **demonstration of architecture reasoning**, not banking software.
Explicitly out of scope:

- ❌ Real transactions, real money movement, payment gateways
- ❌ A core banking system
- ❌ Real customer data
- ❌ Full BIAN API conformance or certification
- ❌ The complete 259-domain Service Landscape
- ❌ Production identity infrastructure
- ❌ Kafka, Kubernetes, cloud deployment, service mesh

The goal is a clear, defensible architecture story — not an oversized demo.

---

## Limitations

Stated plainly, because a POC that hides its edges is not credible.

**On the engine**

- It scores **vocabulary overlap, not business intent**. An API described
  only as "does the thing" maps to nothing useful — correctly, but not
  helpfully.
- The verb signal is coarse: it cannot distinguish `Execute` from `Initiate`.
- IDF is computed over the 40-domain demo slice. Across all 259 domains the
  weights would shift (for the better) with no code change.
- Scores are **relational, not absolute**. "75%" means *this candidate beat
  the others on these signals*, not "75% correct".

**On the data**

- 40 of ~259 domains. Deliberate, and documented.
- Dependency edges between domains are curated for the demo and are **not**
  official BIAN relations. Labelled as such in the seed file and the UI.
- Business-area grouping is simplified relative to BIAN's own landscape.

**On the application**

- Auth is minimal: JWT with a dev secret, one guarded endpoint. Roles exist
  in the model but are not enforced across the whole surface.
- No pagination, no multi-tenancy, no caching.
- No CI pipeline; tests are run manually.

**On terminology**

- Every score is an **alignment score** produced by this tool. It is not a
  BIAN certification, conformance rating, or compliance measure, and it must
  never be presented as one.

---

## Why this project exists

BIAN is often misread as "a way to build banking APIs". Its more useful idea
is architectural: **consistent boundaries around banking capabilities**, so
that interfaces are defined by what the bank does rather than by whichever
application happens to implement it this year.

Rather than build another generic banking CRUD application, this project
takes that idea seriously and builds the missing tool — something that maps
an existing API estate onto those boundaries, surfaces where teams have
overlapped, and visualises the result. The value is in the reasoning the
tool makes visible, not in the API endpoints it exposes.

---

## Deeper documentation

| Document | Covers |
| --- | --- |
| [`docs/bian.md`](docs/bian.md) | What BIAN is, which release is used, what is borrowed vs. curated |
| [`docs/mapping.md`](docs/mapping.md) | The engine in depth — why IDF, why recall, the scoring maths, the deferred AI path |
| [`docs/architecture.md`](docs/architecture.md) | System design, data model, request flows, module boundaries, security posture |

---

## Licence & attribution

Project code: **MIT**.

Service Domain names, purposes and Service Operation definitions in
`seed/bian-service-domains.json` are derived from BIAN's published artifacts
at <https://github.com/bian-official/public> (**Apache-2.0**) and remain the
property of BIAN. BIAN and the BIAN Service Landscape are the trademarks of
the **Banking Industry Architecture Network**.

This project is an **independent proof-of-concept**. It is not affiliated
with, endorsed by, sponsored by, or certified by BIAN, and it does not
reproduce BIAN's proprietary tooling.

### References

- BIAN — <https://bian.org>
- BIAN Service Landscape — <https://bian.org/deliverables/service-landscape/>
- BIAN portal (registration required) — <https://portal.bian.org>
- Public BIAN artifacts used here — <https://github.com/bian-official/public>
