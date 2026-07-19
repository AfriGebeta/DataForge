export type RunStatus = "RUNNING" | "SUCCESS" | "FAILED" | "TIMEOUT";

export type WorkerRun = {
  id: string;
  run_id: string;
  channel: string;
  status: RunStatus;
  ingested_count: number;
  duplicate_count: number;
  cursor_before: string;
  cursor_after: string | null;
  duration_seconds: number | null;
  created_at: string;
};

export type RunsStats = {
  total_runs: number;
  success_rate: number;
  total_ingested: number;
  avg_duration_seconds: number;
};

export type RunsParams = {
  page?: number;
  pageSize?: number;
  status?: RunStatus;
  channel?: string;
};

export type RunsResponse = {
  data: WorkerRun[];
  stats: RunsStats;
  total: number;
  limit: number;
  offset: number;
};