import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type {
  BulkResolveRequest,
  CreateFlagRequest,
  FlagStats,
  ValidationFlag,
  ValidationFlagsParams,
  ValidationFlagsResponse,
} from "./types";

/** Real endpoint: PlaceForge's data-quality module. */
export const API_ENDPOINT = `${API_BASE_URL}/api/v1/flags`;

// Backend shape (data-quality/api/v1/model.ValidationFlagResponse) — place_id
// is a numeric place ID; a few admin-only fields (detected_at, resolved_by,
// field_name) exist server-side but aren't surfaced in this list view.
type BackendFlag = {
  id: string;
  place_id: number;
  category: ValidationFlag["category"];
  severity: ValidationFlag["severity"];
  flag_code: string;
  message: string;
  is_resolved: boolean;
};

function fromBackend(f: BackendFlag): ValidationFlag {
  return { ...f, place_id: String(f.place_id) };
}

// There's no single endpoint for global severity counts, so this issues the
// same "List with limit=1, read total" aggregate PlaceForge's own Overview
// Dashboard uses per-KPI — one cheap request per severity.
async function fetchFlagStats(): Promise<FlagStats> {
  const severities = ["CRITICAL", "ERROR", "WARNING", "INFO"] as const;
  const totals = await Promise.all(
    severities.map(async (severity) => {
      const q = new URLSearchParams({ severity, is_resolved: "false", limit: "1" });
      const res = await apiFetch(`${API_ENDPOINT}?${q.toString()}`);
      if (!res.ok) return 0;
      const body: { total: number } = await res.json();
      return body.total;
    }),
  );
  return { critical: totals[0], error: totals[1], warning: totals[2], info: totals[3] };
}

export async function fetchValidationFlags(params?: ValidationFlagsParams): Promise<ValidationFlagsResponse> {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.severity) query.set("severity", params.severity);
  if (params?.status === "resolved") query.set("is_resolved", "true");
  if (params?.status === "unresolved") query.set("is_resolved", "false");
  query.set("limit", "100");

  const [listRes, stats] = await Promise.all([
    apiFetch(`${API_ENDPOINT}?${query.toString()}`),
    fetchFlagStats(),
  ]);
  if (!listRes.ok) throw new Error(`Request failed with status ${listRes.status}`);
  const body: { data: BackendFlag[]; total: number } = await listRes.json();
  return { data: body.data.map(fromBackend), stats, total: body.total };
}

export async function createValidationFlag(request: CreateFlagRequest): Promise<ValidationFlag> {
  const res = await apiFetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...request, place_id: Number(request.place_id) }),
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

/** POST /flags/{id}/resolve requires a resolved_by identity — DataForge has no per-admin display name yet, so it identifies itself. */
export async function resolveFlag(id: string, resolvedBy = "dataforge-ui"): Promise<void> {
  const res = await apiFetch(`${API_ENDPOINT}/${id}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resolved_by: resolvedBy }),
  });
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
}

export async function deleteFlag(id: string): Promise<void> {
  const res = await apiFetch(`${API_ENDPOINT}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
}

export async function bulkResolveFlags(request: BulkResolveRequest): Promise<void> {
  const res = await apiFetch(`${API_ENDPOINT}/bulk-resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...request, place_id: Number(request.place_id) }),
  });
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
}