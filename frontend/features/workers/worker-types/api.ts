import type {
  WorkerTypesParams,
  WorkerTypesResponse,
  WorkerType,
  CreateWorkerTypeRequest,
} from "./types";

export const API_ENDPOINT = "http://localhost:8080/api/workers/types" as const;

const fakeWorkerTypes: WorkerType[] = [
  {
    id: "wt-001",
    name: "telegram-scraper",
    version: "1.4.2",
    capabilities: ["TELEGRAM"],
    max_concurrency: 10,
    is_active: true,
    created_at: "2023-09-01T12:00:00Z",
    updated_at: "2023-09-01T12:00:00Z",
  },
  {
    id: "wt-002",
    name: "whatsapp-scraper",
    version: "1.1.0",
    capabilities: ["WHATSAPP"],
    max_concurrency: 5,
    is_active: true,
    created_at: "2023-09-01T12:00:00Z",
    updated_at: "2023-09-01T12:00:00Z",
  },
  {
    id: "wt-003",
    name: "batch-importer",
    version: "2.0.1",
    capabilities: ["BATCH_IMPORT"],
    max_concurrency: 3,
    is_active: true,
    created_at: "2023-09-01T12:00:00Z",
    updated_at: "2023-09-01T12:00:00Z",
  },
  {
    id: "wt-004",
    name: "rest-receiver",
    version: "1.0.0",
    capabilities: ["REST_API"],
    max_concurrency: 20,
    is_active: false,
    created_at: "2023-09-01T12:00:00Z",
    updated_at: "2023-09-01T12:00:00Z",
  },
];

export async function fetchWorkerTypes(
  params?: WorkerTypesParams,
): Promise<WorkerTypesResponse> {
  try {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const res = await fetch(
      `${API_ENDPOINT}?limit=${pageSize}&offset=${(page - 1) * pageSize}`,
    );
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to mock data for fetchWorkerTypes:", cause);
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const start = (page - 1) * pageSize;
    return {
      data: fakeWorkerTypes.slice(start, start + pageSize),
      total: fakeWorkerTypes.length,
      limit: pageSize,
      offset: start,
    };
  }
}

export async function createWorkerType(
  request: CreateWorkerTypeRequest,
): Promise<WorkerType> {
  try {
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to mock data for createWorkerType:", cause);
    const newWorker: WorkerType = {
      id: `wt-${Date.now()}`,
      ...request,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    fakeWorkerTypes.push(newWorker);
    return newWorker;
  }
}

export async function toggleWorkerTypeStatus(
  id: string,
  is_active: boolean,
): Promise<WorkerType> {
  try {
    const res = await fetch(`${API_ENDPOINT}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active }),
    });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to mock data for toggleWorkerTypeStatus:", cause);
    const worker = fakeWorkerTypes.find((w) => w.id === id);
    if (!worker) throw new Error("Worker not found");
    worker.is_active = is_active;
    return worker;
  }
}
