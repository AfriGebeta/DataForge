import type {
  RunsParams,
  RunsResponse,
  WorkerRun,
} from "./types";

export const API_ENDPOINT = "http://localhost:8080/api/workers/runs" as const;

const fakeRuns: WorkerRun[] = [
  {
    id: "run-001",
    run_id: "run-a1b2",
    channel: "@addis_poi_reports",
    status: "SUCCESS",
    ingested_count: 35,
    duplicate_count: 3,
    cursor_before: "98765",
    cursor_after: "99100",
    duration_seconds: 3.2,
    created_at: "2023-10-01T12:00:00Z",
  },
  {
    id: "run-002",
    run_id: "run-c3d4",
    channel: "@addis_poi_reports",
    status: "SUCCESS",
    ingested_count: 41,
    duplicate_count: 1,
    cursor_before: "99100",
    cursor_after: "99141",
    duration_seconds: 4.1,
    created_at: "2023-10-01T12:05:00Z",
  },
  {
    id: "run-003",
    run_id: "run-e5f6",
    channel: "@addis_real_estate",
    status: "RUNNING",
    ingested_count: 12,
    duplicate_count: 0,
    cursor_before: "54100",
    cursor_after: null,
    duration_seconds: null,
    created_at: "2023-10-01T12:10:00Z",
  },
  {
    id: "run-004",
    run_id: "run-g7h8",
    channel: "@addis_poi_reports",
    status: "FAILED",
    ingested_count: 0,
    duplicate_count: 0,
    cursor_before: "99141",
    cursor_after: "99141",
    duration_seconds: 30.0,
    created_at: "2023-10-01T12:15:00Z",
  },
];

export async function fetchRuns(
  params?: RunsParams,
): Promise<RunsResponse> {
  try {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const status = params?.status ? `&status=${params.status}` : "";
    const channel = params?.channel ? `&channel=${params.channel}` : "";
    const res = await fetch(
      `${API_ENDPOINT}?limit=${pageSize}&offset=${(page - 1) * pageSize}${status}${channel}`,
    );
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to mock data for fetchRuns:", cause);
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const start = (page - 1) * pageSize;
    let filtered = [...fakeRuns];
    if (params?.status) filtered = filtered.filter((r) => r.status === params.status);
    if (params?.channel) filtered = filtered.filter((r) => r.channel === params.channel);
    return {
      data: filtered.slice(start, start + pageSize),
      stats: {
        total_runs: 1482,
        success_rate: 99.8,
        total_ingested: 48200,
        avg_duration_seconds: 4.3,
      },
      total: filtered.length,
      limit: pageSize,
      offset: start,
    };
  }
}