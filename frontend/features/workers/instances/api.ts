import type {
  InstancesParams,
  InstancesResponse,
  WorkerInstance,
} from "./types";

export const API_ENDPOINT = "http://localhost:8080/api/workers/instances" as const;

const fakeInstances: WorkerInstance[] = [
  {
    id: "inst-001",
    instance_id: "pod-tg-abc123",
    worker_name: "telegram-scraper",
    status: "ALIVE",
    throughput_per_min: 18.2,
    processed_count: 48201,
    last_heartbeat_at: new Date(Date.now() - 3000).toISOString(),
    created_at: "2023-09-01T12:00:00Z",
  },
  {
    id: "inst-002",
    instance_id: "pod-tg-def456",
    worker_name: "telegram-scraper",
    status: "ALIVE",
    throughput_per_min: 9.4,
    processed_count: 21044,
    last_heartbeat_at: new Date(Date.now() - 8000).toISOString(),
    created_at: "2023-09-01T12:00:00Z",
  },
  {
    id: "inst-003",
    instance_id: "pod-tg-ghi789",
    worker_name: "telegram-scraper",
    status: "DRAINING",
    throughput_per_min: 0,
    processed_count: 5312,
    last_heartbeat_at: new Date(Date.now() - 15000).toISOString(),
    created_at: "2023-09-01T12:00:00Z",
  },
  {
    id: "inst-004",
    instance_id: "pod-batch-jkl",
    worker_name: "batch-importer",
    status: "DEAD",
    throughput_per_min: 0,
    processed_count: 142801,
    last_heartbeat_at: new Date(Date.now() - 28800000).toISOString(),
    created_at: "2023-09-01T12:00:00Z",
  },
];

export async function fetchInstances(
  params?: InstancesParams,
): Promise<InstancesResponse> {
  try {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const status = params?.status ? `&status=${params.status}` : "";
    const res = await fetch(
      `${API_ENDPOINT}?limit=${pageSize}&offset=${(page - 1) * pageSize}${status}`,
    );
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to mock data for fetchInstances:", cause);
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const start = (page - 1) * pageSize;
    const filtered = params?.status
      ? fakeInstances.filter((i) => i.status === params.status)
      : fakeInstances;
    return {
      data: filtered.slice(start, start + pageSize),
      total: filtered.length,
      limit: pageSize,
      offset: start,
    };
  }
}

export async function drainInstance(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_ENDPOINT}/${id}/drain`, {
      method: "POST",
    });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  } catch (cause) {
    console.warn("Falling back to mock for drainInstance:", cause);
    const instance = fakeInstances.find((i) => i.id === id);
    if (instance) instance.status = "DRAINING";
  }
}

export async function stopInstance(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_ENDPOINT}/${id}/stop`, {
      method: "POST",
    });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  } catch (cause) {
    console.warn("Falling back to mock for stopInstance:", cause);
    const instance = fakeInstances.find((i) => i.id === id);
    if (instance) instance.status = "DEAD";
  }
}