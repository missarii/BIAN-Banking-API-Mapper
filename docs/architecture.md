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
