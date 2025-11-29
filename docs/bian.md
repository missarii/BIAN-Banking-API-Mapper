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
