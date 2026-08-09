/** Mirrors PlaceForge's worker module WorkerRun (GET /api/v1/runs, /api/v1/runs/stats). */

export type RunStatus = "RUNNING" | "SUCCESS" | "FAILED" | "TIMEOUT";

export type WorkerRun = {
  id: string;
  channel_config_id: string;
  worker_instance_id: string;
  started_at: string;
  finished_at?: string;
  status: RunStatus;
  ingested_count: number;
  duplicate_count: number;
  failed_count: number;
  error_message?: string;
  cursor_before?: string;
  cursor_after?: string;
};

export type RunStats = {
  channel_config_id?: string;
  total_runs: number;
  success_runs: number;
  failed_runs: number;
  total_ingested: number;
  total_duplicate: number;
  total_failed: number;
  avg_duration_sec: number;
};

export type RunsParams = {
  status?: RunStatus;
  channelConfigId?: string;
  limit?: number;
  offset?: number;
};

export type RunsResponse = {
  data: WorkerRun[];
  total: number;
  limit: number;
  offset: number;
};
