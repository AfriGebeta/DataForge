import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type {
  CreatePlaceSourceRequest,
  PlaceSource,
  PlaceSourcesParams,
  PlaceSourcesResponse,
  UpdatePlaceSourceRequest,
} from "./types";

export const API_ENDPOINT = `${API_BASE_URL}/api/v1/place-sources`;

export async function fetchPlaceSources(params?: PlaceSourcesParams): Promise<PlaceSourcesResponse> {
  const query = new URLSearchParams();
  query.set("page", String(params?.page ?? 1));
  query.set("limit", String(params?.limit ?? 20));
  if (params?.placeId) query.set("place_id", params.placeId);

  const res = await apiFetch(`${API_ENDPOINT}?${query.toString()}`);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return res.json();
}

export async function fetchPlaceSource(id: string): Promise<PlaceSource> {
  const res = await apiFetch(`${API_ENDPOINT}/${id}`);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return res.json();
}

export async function createPlaceSource(request: CreatePlaceSourceRequest): Promise<PlaceSource> {
  const res = await apiFetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    let msg = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(msg);
  }
  return res.json();
}

export async function updatePlaceSource(id: string, request: UpdatePlaceSourceRequest): Promise<PlaceSource> {
  const res = await apiFetch(`${API_ENDPOINT}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return res.json();
}

export async function deletePlaceSource(id: string): Promise<void> {
  const res = await apiFetch(`${API_ENDPOINT}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
}
