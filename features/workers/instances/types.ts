/** Mirrors PlaceForge's worker module WorkerInstance (GET /api/v1/instances). */

export type InstanceStatus = "ALIVE" | "DRAINING" | "DEAD";

export type WorkerInstance = {
  id: string;
  worker_id: string;
  instance_id: string;
  status: InstanceStatus;
  queue: string;
  last_beat_at: string;
  started_at: string;
  stopped_at?: string;
  processed_count: number;
  error_count: number;
  dlq_count: number;
  throughput_mpm?: number;
  created_at: string;
  updated_at: string;
};

export type InstancesParams = {
  status?: InstanceStatus;
  workerId?: string;
  limit?: number;
  offset?: number;
};

export type InstancesResponse = {
  data: WorkerInstance[];
  total: number;
  limit: number;
  offset: number;
};
