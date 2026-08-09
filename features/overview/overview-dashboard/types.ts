/**
 * Domain types for overview-dashboard — mirrors PlaceForge's
 * `GET /overview/dashboard` (overview module) response exactly.
 * snake_case JSON, matching the data-quality/ingest convention.
 */

export type AlertItem = {
  id: string;
  flag_code: string;
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  message: string;
  place_id: number;
};

export type ActivityItem = {
  status: string;
  detail: string;
  at: string;
};

export type DashboardResponse = {
  total_places: number;
  ai_accuracy: number;

  human_review_queue: number;
  duplicate_candidates: number;

  ingests_today: number;
  success_rate: number;

  alive_workers: number;
  draining_workers: number;
  dead_letters: number;

  open_flags: number;
  critical_flags: number;

  pending_deltas: number;
  merges_today: number;
  completeness_rules_count: number;

  ingest_status_breakdown: Record<string, number>;
  trust_distribution: Record<string, number>;

  live_alerts: AlertItem[];
  activity_feed: ActivityItem[];
};
