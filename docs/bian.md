# BIAN, and what this project borrows from it

> This project is an **independent proof of concept**. It is not affiliated
> with, endorsed by, or a re-implementation of the Banking Industry
> Architecture Network (BIAN). BIAN terminology is used descriptively.

## What BIAN actually is

BIAN is a standards body that defines a **reference architecture** for
banking. Two ideas matter for this project:

1. **Service Landscape** — a reference structure for organising the bank
   into **Service Domains**. A Service Domain is a discrete partition of
   business capability (e.g. *Current Account*, *Payment Order Initiation*)
   with a **Control Record** (the thing it manages) — not a process step.
2. **Semantic APIs** — each Service Domain publishes a standard API shape:
   `Initiate`, `Retrieve`, `Update`, `Control`, `Execute`, `Evaluate`, plus
   Behavior Qualifier operations (`CR` / `BQ` tags).

The intent is *stable boundaries*: interfaces defined by capability rather
than by the application that happens to implement them today.

## Which release this project uses

The catalogue in `seed/bian-service-domains.json` is generated from
**BIAN Service Landscape 14.0.0** semantic API artifacts published at
<https://github.com/bian-official/public> (Apache-2.0), under
`release14.0.0/semantic-apis/oas3/yamls`.

`scripts/build_seed.py` downloads that folder and extracts, **verbatim**:

| Field here             | BIAN source                                    |
| ---------------------- | ---------------------------------------------- |
| `name`                 | `info.title`                                   |
| `description`          | `info.description` (the domain's stated purpose)|
| `operations[]`         | `paths` → method + `operationId` + `summary`   |
| `controlRecord`        | the `CR - <ControlRecord>` tag                 |
| `behaviorQualifiers[]` | the `BQ - <BehaviorQualifier>` tags            |

### Version drift is real — and it is a talking point

The Service Landscape is rationalised between releases. Two examples that
surprise people who learned BIAN from 8.x/9.x blog posts:

* **"Payment Execution" no longer exists in 14.0.** The Payments area was
  re-organised around `PaymentOrderInitiation`, `PaymentRail`,
  `TransactionEngine`, `DirectDebit`, `StandingOrder`, `Disbursement` and
  `FinancialGateway`.
* **"Customer Profile" no longer exists either.** Customer capability now
  sits in `PartyReferenceDataDirectory`, `PartyLifecycleManagement`,
  `CustomerRelationshipManagement`, `CustomerPosition`, etc.

So a tool that hard-codes names from a blog post years ago is wrong on
arrival. Generating the catalogue from the published release is what keeps
this honest — and re-running `pnpm seed:build` against a future release is
the upgrade path.

## What is *ours*, not BIAN's

Clearly separated, in the seed file and in the UI:

* **`businessArea` grouping** — we bucket the 40 demo domains into
  Customer / Accounts / Payments / Cards / Loans / Risk & Compliance /
  Security & Access / Products / Servicing / Finance / Treasury. BIAN's own
  Service Landscape has its own grouping; ours is simplified for the demo.
* **`dependencies[]` edges** — curated by hand for the graph demo. They are
  *illustrative*, **not** official BIAN relations.
* **Every score** — the alignment percentage, confidence band, coverage and
  duplicate metrics are this tool's own analytical output. They are **not**
  a BIAN certification, conformance score, or compliance measure.

## Why only 40 domains?

BIAN 14.0 publishes ~259 semantic API artifacts. This POC ships a curated
40-domain slice chosen to cover a realistic retail/corporate banking demo.
The catalog design is release-agnostic: swapping in all 259 is a matter of
extending the `DOMAINS` list in `scripts/build_seed.py` and re-running it.

## Further reading

* BIAN Service Landscape — <https://bian.org/deliverables/service-landscape/>
* BIAN portal (registration required) — <https://portal.bian.org/>
* Public BIAN artifacts used here — <https://github.com/bian-official/public>
