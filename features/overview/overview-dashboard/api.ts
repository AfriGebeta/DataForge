import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type { DashboardResponse } from "./types";

// Real endpoint: PlaceForge's overview module — a read-only aggregate
// composed from ingest, worker, data-quality, and place repositories at
// request time. Nothing here is cached or persisted.
// GET /api/v1/overview/dashboard
export const API_ENDPOINT = `${API_BASE_URL}/api/v1/overview/dashboard`;

const emptyResponse: DashboardResponse = {
  total_places: 0,
  ai_accuracy: 0,
  human_review_queue: 0,
  duplicate_candidates: 0,
  places_missing_category: 0,
  places_missing_coordinates: 0,
  places_needing_refresh: 0,
  ingests_today: 0,
  success_rate: 0,
  alive_workers: 0,
  draining_workers: 0,
  dead_letters: 0,
  open_flags: 0,
  critical_flags: 0,
  pending_deltas: 0,
  merges_today: 0,
  completeness_rules_count: 0,
  ingest_status_breakdown: {},
  trust_distribution: {},
  live_alerts: [],
  activity_feed: [],
};

export async function fetchOverviewDashboard(): Promise<DashboardResponse> {
  try {
    const res = await apiFetch(API_ENDPOINT);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to empty data for fetchOverviewDashboard:", cause);
    return emptyResponse;
  }
}
