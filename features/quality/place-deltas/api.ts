import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type {
  CreatePlaceDeltaRequest,
  PlaceDelta,
  PlaceDeltasParams,
  PlaceDeltasResponse,
} from "./types";

/** Real endpoint: PlaceForge's data-quality module. */
export const API_ENDPOINT = `${API_BASE_URL}/api/v1/deltas`;

// Backend shape (data-quality/api/v1/model.PlaceDeltaResponse) — IDs are
// numeric, and the changed value lives in after_data (arbitrary JSON), not
// a pre-stringified after_value.
type BackendDelta = {
  id: string;
  source_place_id: number;
  target_place_id?: number;
  action: PlaceDelta["action"];
  field_name?: string;
  source_type: PlaceDelta["source_type"];
  after_data: unknown;
  is_applied: boolean;
};

function stringifyValue(v: unknown): string {
  return typeof v === "string" ? v : JSON.stringify(v);
}

function fromBackend(d: BackendDelta): PlaceDelta {
  return {
    id: d.id,
    source_place_id: d.source_place_id,
    target_place_id: d.target_place_id,
    action: d.action,
    field_name: d.field_name ?? "",
    source_type: d.source_type,
    after_value: stringifyValue(d.after_data),
    is_applied: d.is_applied,
  };
}

// The "After data (JSON)" textarea holds either a JSON literal (object,
// number, bare quoted string) or a plain unquoted value like a phone
// number — try to parse it as JSON first, and fall back to the raw string
// so both forms round-trip through the backend's `interface{}` field.
function parseDataField(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function fetchPlaceDeltas(params?: PlaceDeltasParams): Promise<PlaceDeltasResponse> {
  const query = new URLSearchParams();
  if (params?.action) query.set("action", params.action);
  if (params?.source_type) query.set("source_type", params.source_type);
  if (params?.applied === "applied") query.set("is_applied", "true");
  if (params?.applied === "unapplied") query.set("is_applied", "false");

  const res = await apiFetch(`${API_ENDPOINT}?${query.toString()}`);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  const body: { data: BackendDelta[]; total: number } = await res.json();
  return { data: body.data.map(fromBackend), total: body.total };
}

export async function createPlaceDelta(request: CreatePlaceDeltaRequest): Promise<PlaceDelta> {
  const res = await apiFetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source_place_id: Number(request.source_place_id),
      target_place_id: request.target_place_id ? Number(request.target_place_id) : undefined,
      action: request.action,
      field_name: request.field_name || undefined,
      source_type: request.source_type,
      before_data: request.before_data ? parseDataField(request.before_data) : undefined,
      after_data: parseDataField(request.after_data),
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

export async function applyPlaceDelta(id: string): Promise<void> {
  const res = await apiFetch(`${API_ENDPOINT}/${id}/apply`, { method: "POST" });
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
}

export async function deletePlaceDelta(id: string): Promise<void> {
  const res = await apiFetch(`${API_ENDPOINT}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
}