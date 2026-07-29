export type IngestStatusBreakdown = {
  DONE: number;
  PENDING: number;
  PARSING: number;
  DUPLICATE?: number;
  FAILED?: number;
  [key: string]: number | undefined;
};

export type TrustDistribution = {
  COMPLETE: number;
  GOOD: number;
  PARTIAL: number;
  MINIMAL: number;
};

export type LiveAlert = {
  id: string;
  flag_code: string;
  severity: string;
  message: string;
  place_id: string | number;
};

export type ActivityEntry = {
  status: string;
  detail: string;
  at: string;
};

export type OverviewStats = {
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
  ingest_status_breakdown: IngestStatusBreakdown;
  trust_distribution: TrustDistribution;
  live_alerts: LiveAlert[];
  activity_feed: ActivityEntry[];
};
