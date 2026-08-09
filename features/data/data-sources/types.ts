/**
 * View-model types for the Data Sources dashboard. This page has no
 * dedicated backend endpoint of its own — it composes real data from the
 * ingest module's /ingests/stats and /channels endpoints (see ../raw-ingests
 * and ../channels). Nothing here is fabricated; see DataSourcesPage.tsx.
 */

export type SourceHealthSummary = {
  totalIngests: number;
  doneCount: number;
  failedCount: number;
  successRate: number;
};
