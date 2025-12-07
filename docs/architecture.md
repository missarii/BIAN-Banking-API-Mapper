# Architecture

## System context

```
                    ┌──────────────────────┐
                    │      Architect       │
                    └───────────┬──────────┘
                                │ browser
                    ┌───────────▼──────────┐
                    │   apps/web  (React)  │
                    │   Vite · TS · TW     │
                    │   React Query        │
                    │   React Flow         │
                    └───────────┬──────────┘
                                │ REST /api/v1 (JSON)
                    ┌───────────▼──────────┐
                    │   apps/api (NestJS)  │
                    │   Swagger at /swagger│
                    └───┬────────┬─────────┘
                        │        │
        Prisma Client   │        │  import (in-process)
                        │        │
            ┌───────────▼──┐  ┌──▼─────────────────────────┐
            │ PostgreSQL 16│  │ @bian/mapping-engine (pure)│
            │  Service     │  │  scoring · duplicates      │
            │  Domains     │  │  coverage                  │
            │  APIs/ops    │  └────────────────────────────┘
            │  Mappings    │
            │  Deps/Reviews│
            └──────────────┘
```

## Why this shape

* **The engine is a package, not a service.** `@bian/mapping-engine` has no
  I/O. That is what makes it unit-testable, reusable from a CLI or a batch
  job, and impossible to accidentally couple to Prisma. The API is a thin
  adapter over it.
* **Modular monolith, not microservices.** For a POC, one deployable with
  clear module boundaries (auth / service-domains / apis / mappings /
  import / architecture / dashboard) is the right trade-off. Each Nest
  module owns one bounded concern and could be extracted later if the
  boundaries proved wrong — which is exactly the argument the tool itself
  makes about banking APIs.
* **PostgreSQL, not a document store.** The domain model is genuinely
  relational (API → operations, API ↔ domain via mapping, domain ↔ domain
  dependencies), and Prisma's `String[]` + `Json` cover the flexible parts
  (keywords, BIAN operations) without a second datastore.
* **No Redis, no queue, no Kafka.** There is no asynchronous workload.

## Repository layout

```
apps/
  api/                      NestJS + Prisma + Swagger
    prisma/schema.prisma    data model
    prisma/seed.ts          loads seed/ + demo users + sample APIs
    src/auth/               JWT + roles (ADMIN|ARCHITECT|VIEWER)
    src/service-domains/    BIAN catalogue read API
    src/apis/               internal API registry CRUD
    src/mappings/           analyze + human review  <- the core
    src/import/             OpenAPI 3.x / Swagger 2 parse -> API + operations
    src/architecture/       graph nodes/edges for React Flow
    src/dashboard/          coverage + duplicates metrics
  web/                      React SPA (8 routes)
packages/
  mapping-engine/           pure TS scoring engine + Vitest
scripts/
  build_seed.py             BIAN 14.0 artifacts -> seed/bian-service-domains.json
seed/
  bian-service-domains.json generated, committed for reproducibility
samples/
  banking-api.yaml          demo OpenAPI import
docs/
```

## Data model

```
ServiceDomain ---< Dependency >--- ServiceDomain      (source -> target)
      │
      │ 1..n
      v
   Mapping ---< MappingReview >--- User
      ^
      │ n..1
      │
     Api ---< ApiOperation
```

* `Mapping` has a **unique `(apiId, serviceDomainId)`** so re-analysing is
  an idempotent upsert, not a duplicating insert.
* `Mapping.status` is `CANDIDATE | ACCEPTED | REJECTED`. Only `ACCEPTED`
  flows into the dashboard and the architecture graph — the review step is
  a real gate, not decoration.
* `MappingReview` is the audit trail: who decided what, when, and why.
* `ServiceDomain.bianOperations` is JSON: BIAN's own path shapes are stored
  as-is next to the relational fields, so re-seeding a new BIAN release
  needs no migration.

### Invariant enforced in `MappingsService.review`

Accepting a domain **demotes any other ACCEPTED mapping for that API back
to CANDIDATE**; rejecting demotes all siblings to REJECTED. One API can
therefore never be reported as cleanly aligned to two domains at once.

## Request flows

### Import -> analyse -> review -> visualise

```
POST /import/openapi (file)
        │  parse YAML/JSON, extract paths x methods
        v
   Api + ApiOperation rows
        │
POST /mappings/analyze { apiId }
        │  load domain profiles -> scoreApi()
        v
   Mapping rows upserted as CANDIDATE (+ score, confidence)
        │
POST /mappings/review { apiId, serviceDomainId, decision }
        │  ACCEPT/REJECT/CHANGE + demote siblings + audit row
        v
   GET /dashboard            coverage, duplicates, unmapped
   GET /architecture/graph   api->domain  and  domain->domain edges
```

## API surface

| Method | Path                          | Auth | Purpose                     |
| ------ | ----------------------------- | ---- | --------------------------- |
| POST   | `/auth/login`                 | –    | JWT for a seeded demo user   |
| GET    | `/service-domains`            | –    | search + filter catalogue    |
| GET    | `/service-domains/areas`      | –    | business-area facet counts   |
| GET    | `/service-domains/:idOrSlug`  | –    | purpose, CR, BQs, ops, deps  |
| GET    | `/apis`                       | –    | registry list                |
| POST   | `/apis`                       | –    | register an API manually     |
| GET    | `/apis/:id`                   | –    | operations + mappings        |
| DELETE | `/apis/:id`                   | –    | remove an API                |
| POST   | `/mappings/analyze`           | –    | run the engine, store candidates |
| POST   | `/mappings/review`            | JWT  | accept / reject / change     |
| GET    | `/mappings/api/:apiId`        | –    | mappings for one API         |
| POST   | `/import/openapi`             | –    | multipart OpenAPI import     |
| GET    | `/architecture/graph`         | –    | nodes + edges, filter by area|
| GET    | `/dashboard`                  | –    | metrics + duplicates         |

Swagger UI: <http://localhost:3000/swagger>

## Frontend

Eight routes, each with one job:

| Route                  | Purpose                                            |
| ---------------------- | -------------------------------------------------- |
| `/`                    | alignment dashboard (coverage, duplicates)          |
| `/service-domains`     | searchable BIAN catalogue                           |
| `/service-domains/:id` | purpose, control record, BQ tags, service ops, deps  |
| `/apis`                | internal API registry                               |
| `/apis/:id`            | operations + analyse + per-candidate accept/reject   |
| `/mapping`             | the demo screen: pick API -> candidates -> decide    |
| `/architecture`        | React Flow graph (API->domain, domain->domain)       |
| `/login`               | JWT login for the seeded demo users                  |

State is React Query only — the server is the source of truth, no client
store. React Flow layout is a deterministic grid: a POC does not need a
force-directed layout engine to be legible.

## Deployment (local only, by design)

`docker-compose.yml` runs PostgreSQL 16 on host port **5433** (5432 is
routinely occupied on a developer machine). API and web run from `pnpm` on
the host during development.

Not included, deliberately: Kubernetes, cloud IaC, secrets management, an
observability stack. The point of this project is the architecture
reasoning; a deployment story would dilute it.

## Security posture (POC)

JWT with a shared dev secret; roles are modelled but only
`POST /mappings/review` is actually guarded. No refresh tokens, no MFA, no
rate limiting. Stated plainly so each gap is a known trade-off rather than
an oversight — see `README.md` -> Limitations.