import type {
  CreateMergeRecordRequest,
  MergeRecord,
  MergeRecordsParams,
  MergeRecordsResponse,
} from "./types";

export const API_ENDPOINT = "http://localhost:8080/api/quality/merges" as const;

const fakeMerges: MergeRecord[] = [
  { id: "1", winner_id: "a1b2", loser_id: "x9y0", strategy: "AUTO_DISTANCE", reason: "Distance 4.2m, name sim 0.97", merged_by: "conflation-v2", merged_at: "5m ago" },
  { id: "2", winner_id: "c3d4", loser_id: "w7v8", strategy: "AUTO_NAME_MATCH", reason: "Exact name + same address block", merged_by: "conflation-v2", merged_at: "1h ago" },
  { id: "3", winner_id: "e5f6", loser_id: "u5t4", strategy: "MANUAL", reason: "Operator confirmed duplicate", merged_by: "ops-team", merged_at: "3h ago" },
  { id: "4", winner_id: "g7h8", loser_id: "s3r2", strategy: "AUTO_OVERLAP", reason: "Polygon overlap 91%", merged_by: "conflation-v2", merged_at: "6h ago" },
];

export async function fetchMergeRecords(params?: MergeRecordsParams): Promise<MergeRecordsResponse> {
  try {
    const res = await fetch(API_ENDPOINT);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to mock data for fetchMergeRecords:", cause);
    let filtered = [...fakeMerges];
    if (params?.strategy) filtered = filtered.filter((m) => m.strategy === params.strategy);
    return { data: filtered, total: filtered.length };
  }
}

export async function createMergeRecord(request: CreateMergeRecordRequest): Promise<MergeRecord> {
  try {
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to mock for createMergeRecord:", cause);
    const newMerge: MergeRecord = {
      id: `${Date.now()}`,
      ...request,
      merged_at: "Just now",
    };
    fakeMerges.unshift(newMerge);
    return newMerge;
  }
}