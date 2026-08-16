# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Internal Gebeta Maps staff (data-quality/ops team and engineers) who operate PlaceForge, the
place-data ingestion & quality API. They use this dashboard all day as a working tool, not an
occasional glance — reviewing ingestion channels, resolving data-quality flags/deltas/merges,
approving/rejecting AI-flagged duplicates and geographic validation issues, managing category
taxonomy, and monitoring background workers. Not customer-facing; no external/public users.

## Product Purpose

Admin dashboard giving PlaceForge operators visibility and control over the place-data pipeline:
ingestion (channels/cursors/raw ingests/schemas), data quality (flags/deltas/merges/completeness),
human-in-the-loop verification (review queue, duplicate detection, geographic validation), worker
health, category taxonomy, and AI analysis results. Success = operators can quickly find the
records/issues that need action and resolve them with minimal clicks.

## Positioning

Internal operations tool, not a market product — no competitor positioning applies. Its value is
being the control surface over PlaceForge's pipeline that no other tool has visibility into.

## Operating Context

Used at a desk, full workday, on desktop browsers primarily (existing responsive breakpoints down
to mobile exist and should be preserved). Every `/api/v1/*` PlaceForge route (except login) requires
a Bearer JWT; the dashboard gates all routes except `/login` behind a `gebeta_token` cookie.
Workflows are data-dense: tables, filters, status badges, review/approve-reject actions, metric
cards, worker/queue monitoring.

## Capabilities and Constraints

- Next.js 16.2.9 (pre-release, breaking changes vs. training data — consult
  `node_modules/next/dist/docs/` before using unfamiliar APIs), React 19.2.4, Tailwind CSS 4,
  shadcn/ui, Radix primitives, TanStack Table, Framer Motion, lucide-react icons.
- `app/` routes pair 1:1 with `features/<domain>/` folders; shared UI lives in `features/shared/`
  (Sidebar, Topbar, GlassCard, ModalsMount, page-registry) and `components/ui/` +
  `components/layout/` (shadcn-derived Card/Badge/DataTable/Progress + AppShell/Sidebar/Topbar).
  Some pages are still class-based/legacy HTML-string rendered (`.card`, `.mc`, `.btn`, `.bx`,
  `.chip`, `.tag`, `.category-*`, etc. in `app/globals.css`) rather than shadcn components — both
  systems currently coexist and must both be re-themed.
  ~16 feature areas: overview, data, quality, verification, workers, categories, ai-analysis,
  business, place, schema, system, login, auth.
- No test suite; CI runs `npm run lint` + `tsc --noEmit` + `npm run build`.
- Every `features/*/api.ts` calls PlaceForge through `lib/api-fetch.ts`'s `apiFetch()` — do not
  touch data-fetching logic as part of a visual redesign.

## Brand Commitments

Gebeta Maps brand orange (`#e86815` / `#d05a0b`) is a confirmed binding accent color — user chose
to keep it as the accent when moving off the current dark theme (2026-08-14). No other binding
visual constraints; typography (Inter/JetBrains Mono/Space Grotesk via `next/font`), the dark
near-black theme, and the glassmorphism style are NOT binding — user explicitly wants the color
scheme replaced (white/light) and the glass/blur aesthetic simplified to a clean flat admin style
as part of this redesign.

## Evidence on Hand

Current implementation (`app/globals.css`, `features/shared/*`, `components/ui/*`,
`components/layout/*`) is the incumbent visual system — treated as anti-reference per the
redesign request, not preserved. No DESIGN.md exists yet.

## Product Principles

- Scanability and consistency outrank expression — this is an Operate-mode tool used for hours by
  people resolving data-quality issues, not a marketing surface.
- One set of design tokens and shared components should drive the whole app, since ~16 feature
  areas already build on `features/shared/` and `components/ui/` — redesign there, not page by page.
- Status/severity signaling (success/warning/danger/info badges, risk levels, review states) is
  core to the job-to-be-done and must stay legible and fast to scan after the palette change.
- Preserve existing routes, data-fetching (`apiFetch`), responsive breakpoints, and functionality;
  this is a visual redesign, not a feature or architecture change.

## Accessibility & Inclusion

No explicit standard was established; treat WCAG AA contrast as the baseline given the white
background and all-day internal use.
