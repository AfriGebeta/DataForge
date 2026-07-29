import type { OverviewStats } from "./types";

export const API_ENDPOINT = "http://localhost:8080/api/overview" as const;

const mockStats: OverviewStats = {
  total_places: 42891034,
  ai_accuracy: 98.4,
  human_review_queue: 1204,
  duplicate_candidates: 3492,
  ingests_today: 4821,
  success_rate: 94.1,
  alive_workers: 7,
  draining_workers: 2,
  dead_letters: 23,
  open_flags: 142,
  critical_flags: 38,
  pending_deltas: 287,
  merges_today: 14,
  completeness_rules_count: 31,
  ingest_status_breakdown: {
    DONE: 4532,
    PENDING: 142,
    PARSING: 88,
    DUPLICATE: 41,
    FAILED: 18,
  },
  trust_distribution: {
    COMPLETE: 65,
    GOOD: 20,
    PARTIAL: 10,
    MINIMAL: 5,
  },
  live_alerts: [
    {
      id: "alert-001",
      flag_code: "SUSPICIOUS_COORDINATES",
      severity: "CRITICAL",
      message: "Entity GE0-8921 mapped in the ocean.",
      place_id: "GE0-8921",
    },
    {
      id: "alert-002",
      flag_code: "COUNTRY_MISMATCH",
      severity: "CRITICAL",
      message: "Address indicates FR, coordinates fall in DE.",
      place_id: "GE0-8922",
    },
    {
      id: "alert-003",
      flag_code: "HIGH_CONFIDENCE_DUPLICATE",
      severity: "WARNING",
      message: '98% match found for "Central Park Cafe".',
      place_id: "GE0-8923",
    },
  ],
  activity_feed: [
    {
      status: "DONE",
      detail: "POI · @addis_poi_reports",
      at: new Date(Date.now() - 2000).toISOString(),
    },
    {
      status: "PARSING",
      detail: "POI · @addis_poi_reports",
      at: new Date(Date.now() - 12000).toISOString(),
    },
    {
      status: "FAILED",
      detail: "ROAD · REST_API",
      at: new Date(Date.now() - 60000).toISOString(),
    },
    {
      status: "DUPLICATE",
      detail: "POI · Telegram Bot",
      at: new Date(Date.now() - 180000).toISOString(),
    },
    {
      status: "DONE",
      detail: "NATURAL · BATCH_IMPORT",
      at: new Date(Date.now() - 300000).toISOString(),
    },
  ],
};

export async function fetchOverviewStats(): Promise<OverviewStats> {
  try {
    const res = await fetch(API_ENDPOINT);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch {
    return mockStats;
  }
}
