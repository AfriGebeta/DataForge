# Verification menu — backend integration guide

Audience: interns wiring up or extending the pages under **Verification**
(`app/verification/*`, `features/verification/*`).

> **Update (later session):** the menu was restructured down to **two**
> pages — **Verification Queue** and **Geographic Validation**.
> **Duplicate Detection** and **Human Review** were removed as separate
> pages because they duplicated what Verification Queue already showed
> (the same NEEDS_REVIEW places, including ones flagged `aiDecision=DUPLICATE`).
> Their functionality now lives inside two other flows instead:
> - The generic "edit this place's fields and Approve/Reject" workflow
>   (what Human Review did) is `features/verification/shared/PlaceDetailPage.tsx`,
>   reached by clicking any row in Verification Queue
>   (`/verification/queue/[id]`) — also reused by Geographic Validation
>   (`/verification/geographic-validation/[id]`).
> - The "review a proposed merge, resolve per-field conflicts, apply/reject"
>   workflow (what Duplicate Detection did) is now
>   `features/verification/merge-review/MergeReviewPage.tsx`
>   (`/verification/merge-review/[placeId]`), reached specifically by
>   clicking a Verification Queue row whose `aiDecision` is `DUPLICATE`.
>   It's a React port of `PlaceForge/scripts/merge_review.html` (a
>   standalone reviewer tool that already existed in the backend repo) —
>   same functionality (order banner, per-field resolve controls, apply/reject),
>   adapted to this app's design system.
>
> Everything below this point describes the **original 4-page structure**
> and is kept for the field-mapping/gap-analysis content, which is still
> accurate — just mentally substitute "Duplicate Detection" → merge-review
> and "Human Review" → the place-detail edit page where you see them.

## TL;DR

Before this pass, **none of the four pages called a real endpoint.** Every
`api.ts` was a stub returning `{ items: [], total: 0 }` with `unknown[]`
types, and the visible UI (`content.ts`) was static HTML with hand-written
fake data — including some fields (embedding similarity %, RAG confidence
score, entity-resolution graph, "knowledge retrieval source" latencies)
that don't correspond to anything stored anywhere in this codebase.

The backend (PlaceForge) already had most of the real data model for three
of the four pages — it just wasn't filterable/enriched the way the UI
needs. This pass:

1. Extended `GET /places` with `reviewStatus`/`isVisible`/`aiDecision`
   filters and added those fields (+ AI scores) to the list response.
2. Added `POST /places/{id}/review` (approve/reject) — the one action
   Human Review needs.
3. Enriched `MergeRecordResponse` (list + get + apply + reject) with
   winner/loser place names and AI duplicate scores, so Duplicate
   Detection doesn't need N+1 calls.
4. Rewrote all four `types.ts`/`api.ts` pairs to call the real endpoints
   below, with a `try/fetch → catch → empty-response` fallback (the same
   pattern already used in `features/quality/*`).

`content.ts` (the static HTML mockup) in each feature folder was **left
alone** — wiring real data into the actual rendered components is follow-up
work, not done in this pass. What's real now is the `fetchX()` functions
and their types; the pages still render the old static markup.

## Convention warning: two JSON casing styles

PlaceForge has two unrelated naming conventions depending on which module
you're calling — mixing them up is the single easiest mistake here:

| Module | Casing | Example |
|---|---|---|
| `place` (Verification Queue, Human Review) | **camelCase** | `reviewStatus`, `isVisible`, `aiDuplicateScore` |
| `data-quality` (Duplicate Detection, Geographic Validation) | **snake_case** | `place_id`, `is_resolved`, `winner_ai_duplicate_score` |

Base URL for everything below: `http://localhost:8080/api/v1` (PlaceForge's
dev port — hardcoded per-file, not an env var, matching every other
feature in this frontend).

---

## Verification Queue

**Real endpoint:** `GET /api/v1/places?reviewStatus=NEEDS_REVIEW&limit=&offset=`

Backed by `Place.reviewStatus` / `isVisible` / the denormalized `ai*`
columns (`aiGeoScore`, `aiNameScore`, `aiDuplicateScore`, `aiMlConfidence`,
`aiOverallScore`, `aiDecision`) — these are populated at ingest time when a
parsing worker submits `POST /parsed-entities` with AI validation results
(see `PlaceForge/README.md` → "AI Validation and Auto-Commit"). A place
lands in `NEEDS_REVIEW` whenever GeoValidator's decision was anything but
`VALID`.

| Mockup field | Real field | Notes |
|---|---|---|
| Place ID | `id` | int64 |
| Place Name / Coordinates | `names[].name`, `latitude`/`longitude` | |
| Trust | `aiValues.aiMlConfidence` | 0–100, already a %; render as-is, don't multiply (bug-042: the whole page rendered/thresholded this as 0–1 for who knows how long — showed e.g. "9700%") |
| Status ("Pending") | `reviewStatus` | only `COMPLETED`/`NEEDS_REVIEW` exist — no `PENDING` enum value |
| Dup Risk | `aiValues.aiDuplicateScore` | 0–100, already a % — same as Trust above |
| "Reject & Delete" button | **not implemented** | `Place` has no `DELETE` endpoint anywhere in this API — deactivation (`isActive`/`isVisible`) is the only removal path by design |

`fetchVerificationQueue()` in `verification-queue/api.ts` calls this today.

---

## Duplicate Detection

**Real endpoint:** `GET /api/v1/merges?status=PENDING&limit=&offset=`
**Diff:** `GET /api/v1/merges/{id}/diff`
**Act:** `POST /api/v1/merges/{id}/apply` / `POST /api/v1/merges/{id}/reject`

This was the most complete piece already — `MergeRecord` is a PR-style
proposal (`PENDING` → `APPLIED`/`REJECTED`), opened automatically by
GeoValidator on a confident AI-detected duplicate or manually. Nothing is
ever auto-merged; a human must call `/apply`. Full mechanics in
`PlaceForge/README.md` → "Merging Places".

This pass added `winner_name` / `loser_name` /
`winner_ai_duplicate_score` / `loser_ai_duplicate_score` to the response
(computed from a follow-up read of both places) so the list/diff can
render without extra round-trips.

| Mockup field | Real field | Notes |
|---|---|---|
| "Active Clusters" | `GET /merges?status=PENDING` rows | one row per proposed pair, not a cluster graph |
| "AI Similarity Metrics" (name/coord/metadata/embedding %) | `winner_ai_duplicate_score` / `loser_ai_duplicate_score` only | **no per-metric breakdown or embedding similarity exists** — `aiDuplicateScore` is one overall number GeoValidator computed |
| "Merge Preview: Entity Comparison" | `GET /merges/{id}/diff` | real, field-by-field diff (place/address/attributes/names/contacts) |
| "Entity Resolution Graph" | **not implemented** | no graph-relationship storage anywhere in this repo |
| Confirm Merge / Mark as Distinct | `POST /merges/{id}/apply` / `/reject` | apply takes a `field_resolution` payload — see README for the shape |

`fetchDuplicateDetection()`, `fetchMergeDiff()`, `applyMerge()`,
`rejectMerge()` in `duplicate-detection/api.ts`.

---

## Geographic Validation

**Real endpoints:**
`GET /api/v1/flags?category=GEOMETRY` and `GET /api/v1/flags?category=HIERARCHY`
`GET /api/v1/addresses/{addressId}/admin-levels`

**Scope decision (confirmed with the requester):** storage/query endpoints
only. The actual anomaly-detection logic — comparing an entity's claimed
country/region/city against what its coordinates resolve to — **does not
exist in either PlaceForge or GeoValidate today**:

- PlaceForge never runs this check itself; per its README, it only stores
  AI scores/flags a worker already computed (`ai_*` fields, `PlaceValidationFlag`).
- GeoValidate — the Python service meant to *do* the checking — has its
  `geography/`, `validation/`, `bussiness_rules.py` etc. as **empty stub
  files** (see `GeoValidate/CLAUDE.md`). The logic is planned, not written.

So this page can list flags a worker already raised (`category=GEOMETRY`/
`HIERARCHY`) and show an address's stored admin-level chain
(country→region→zone→city→kebele→neighborhood, levels 0–5), but it cannot
compute or display a live "expected vs. actual" mismatch — there's nothing
to query for that.

| Mockup field | Real field | Notes |
|---|---|---|
| "Country Consistency Check" table | `GET /flags?category=HIERARCHY` rows | shows *that* a mismatch was flagged, not a live recompute |
| "Administrative Hierarchy Check" chain | `GET /addresses/{id}/admin-levels` | plain CRUD storage of a chain — no validation logic attached |
| "RAG Confidence Score" | **not implemented** | no RAG/retrieval pipeline anywhere in this codebase |
| "Knowledge Retrieval" (OSM API, Gov Registry, latencies) | **not implemented** | aspirational — no external source-querying code exists |

`fetchGeographicValidation()` fetches both categories in parallel and
merges them client-side (no combined endpoint exists).
`fetchAdminLevelChain(addressId)` reads the stored chain.

---

## Human Review

**Real endpoints:**
`GET /api/v1/places?reviewStatus=NEEDS_REVIEW` (same data as Verification Queue)
`POST /api/v1/places/{id}/review` — **new in this pass**

```json
// request
{ "decision": "approve" | "reject", "reason": "optional string", "reviewedBy": "optional string" }
```

- `approve` → `reviewStatus=COMPLETED`, `isVisible=true`, `reviewReason` cleared (or set from `reason`).
- `reject` → `reviewStatus=COMPLETED` (there is no `REJECTED` enum value —
  `PlaceReviewStatus` only has `COMPLETED`/`NEEDS_REVIEW`), `isVisible`
  stays `false`, `reviewReason` set. This drops the place out of the
  `NEEDS_REVIEW` queue **without deleting it** — a reviewer can still fix
  the underlying data with `PUT /places/{id}` afterward.

| Mockup action | Real behavior |
|---|---|
| "Approve AI Suggestion" | `POST /places/{id}/review {decision: "approve"}` |
| "Reject & Keep Original" | `POST /places/{id}/review {decision: "reject"}` — keeps the place, just doesn't apply it |
| "Manual Override" | not a distinct backend action — use `PUT /places/{id}` to edit fields directly |
| Map canvas / audit trail | **not implemented** — no per-field change history endpoint beyond `PlaceDelta` (`GET /deltas?source_place_id=`) |

`fetchHumanReview()` and `reviewPlace(id, decision, reason, reviewedBy)` in
`human-review/api.ts`.

---

## Known issue in a sibling feature (not fixed here, flagging for awareness)

`features/quality/merge-records/api.ts` and `features/quality/validation-flags/api.ts`
(a different menu, "Quality") point at `http://localhost:8080/api/quality/merges`
and `.../api/quality/flags`. **That path doesn't exist.** The real routes
have no `/quality` segment — they're `/api/v1/merges` and `/api/v1/flags`,
exactly like the ones documented above. Those two files will silently fall
back to their mock data forever until the base URL is fixed. Worth a
quick follow-up PR since it's a one-line fix per file.

## What's still not real (by design, this pass)

- The visual mockups in each `content.ts` are still static HTML — only the
  `fetchX()` functions and types were made real. Rendering live data in
  the actual components is separate follow-up work.
- Anything involving embeddings, vector similarity, RAG, or an
  entity-resolution graph: no such infrastructure exists in PlaceForge or
  GeoValidate. Don't build fake versions of these — if a future task adds
  real embedding-based duplicate detection, it belongs in GeoValidate
  (which owns AI/ML scoring) with PlaceForge only storing the result, per
  the existing architecture.
