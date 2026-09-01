import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type { InformalArea } from "./types";

const INFORMAL_AREAS_ENDPOINT = `${API_BASE_URL}/api/v1/informal-areas`;

type BackendListResponse = {
  data: InformalArea[];
  total: number;
  limit: number;
  offset: number;
};

async function throwOnError(res: Response): Promise<never> {
  let msg = `Request failed with status ${res.status}`;
  try {
    const body = await res.json();
    if (body?.error) msg = body.error;
  } catch {
    // ignore non-JSON error bodies
  }
  throw new Error(msg);
}

export async function fetchInformalAreas(params: { search?: string } = {}): Promise<InformalArea[]> {
  const query = new URLSearchParams({ limit: "500" });
  if (params.search) query.set("search", params.search);

  const res = await apiFetch(`${INFORMAL_AREAS_ENDPOINT}?${query.toString()}`);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  const body: BackendListResponse = await res.json();
  return body.data;
}

// GET /informal-areas/search?name= — the exact-match "search Megenagna ->
// one fixed point" lookup, same one a consumer-facing search flow would
// call. Returns null on a 404 (no match) instead of throwing, so callers
// can treat "not found" as a normal, expected outcome.
export async function searchInformalAreaByName(name: string): Promise<InformalArea | null> {
  const res = await apiFetch(`${INFORMAL_AREAS_ENDPOINT}/search?name=${encodeURIComponent(name)}`);
  if (res.status === 404) return null;
  if (!res.ok) return throwOnError(res);
  return res.json();
}

export type InformalAreaPayload = {
  name: Record<string, string>;
  latitude: number;
  longitude: number;
};

export async function createInformalArea(payload: InformalAreaPayload): Promise<InformalArea> {
  const res = await apiFetch(INFORMAL_AREAS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return throwOnError(res);
  return res.json();
}

export async function updateInformalArea(id: string, payload: Partial<InformalAreaPayload>): Promise<InformalArea> {
  const res = await apiFetch(`${INFORMAL_AREAS_ENDPOINT}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return throwOnError(res);
  return res.json();
}

export async function deleteInformalArea(id: string): Promise<void> {
  const res = await apiFetch(`${INFORMAL_AREAS_ENDPOINT}/${id}`, { method: "DELETE" });
  if (!res.ok) return throwOnError(res);
}
