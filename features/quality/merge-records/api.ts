import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type {
  CreateMergeRecordRequest,
  MergeRecord,
  MergeRecordsParams,
  MergeRecordsResponse,
} from "./types";

/** Real endpoint: PlaceForge's data-quality module. */
export const API_ENDPOINT = `${API_BASE_URL}/api/v1/merges`;

// Backend shape (data-quality/api/v1/model.MergeRecordResponse) — winner_id/
// loser_id are numeric place IDs, the reason field is `merge_reason`, and
// merged_by/merged_at are only populated once a PENDING proposal is applied.
// POST /merges only ever opens a PENDING proposal — it never moves data by
// itself. See PlaceForge/src/modules/data-quality/api/v1/routes.go.
type BackendMergeRecord = {
  id: string;
  winner_id: number;
  loser_id: number;
  strategy: MergeRecord["strategy"];
  status: MergeRecord["status"];
  merge_reason: string;
  merged_by?: string | null;
  merged_at?: string | null;
};

function fromBackend(r: BackendMergeRecord): MergeRecord {
  return {
    id: r.id,
    winner_id: String(r.winner_id),
    loser_id: String(r.loser_id),
    strategy: r.strategy,
    status: r.status,
    reason: r.merge_reason,
    merged_by: r.merged_by ?? null,
    merged_at: r.merged_at ?? null,
  };
}

export async function fetchMergeRecords(params?: MergeRecordsParams): Promise<MergeRecordsResponse> {
  const query = new URLSearchParams();
  if (params?.strategy) query.set("strategy", params.strategy);

  const res = await apiFetch(`${API_ENDPOINT}?${query.toString()}`);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  const body: { data: BackendMergeRecord[]; total: number } = await res.json();
  return { data: body.data.map(fromBackend), total: body.total };
}

/** Opens a PENDING merge proposal — same lifecycle the Verification → Merge Review page applies/rejects. */
export async function createMergeRecord(request: CreateMergeRecordRequest): Promise<MergeRecord> {
  const res = await apiFetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      winner_id: Number(request.winner_id),
      loser_id: Number(request.loser_id),
      strategy: request.strategy,
      merge_reason: request.reason,
      merged_by: request.merged_by || undefined,
    }),
  });
  if (!res.ok) {
    let msg = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) msg = body.message;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(msg);
  }
  return fromBackend(await res.json());
}