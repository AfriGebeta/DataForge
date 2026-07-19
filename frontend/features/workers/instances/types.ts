export type InstanceStatus = "ALIVE" | "DRAINING" | "DEAD";

export type WorkerInstance = {
  id: string;
  instance_id: string;
  worker_name: string;
  status: InstanceStatus;
  throughput_per_min: number;
  processed_count: number;
  last_heartbeat_at: string;
  created_at: string;
};

export type InstancesParams = {
  page?: number;
  pageSize?: number;
  status?: InstanceStatus;
};

export type InstancesResponse = {
  data: WorkerInstance[];
  total: number;
  limit: number;
  offset: number;
};