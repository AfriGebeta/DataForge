import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type { CreatePlaceRequest, PlaceListParams, PlaceListResponse } from "./types";
import type { PlaceDetail } from "@/features/verification/shared/types";

/** Real endpoint: PlaceForge's place module. */
export const API_ENDPOINT = `${API_BASE_URL}/api/v1/places`;

/**
 * GET /api/v1/places — list places with real filters (limit/offset,
 * placeType, categoryId, isActive, isVisible, reviewStatus, aiDecision,
 * search). `search` is matched server-side: the text is split into words and
 * every word must appear in one of the place's names (or be its id), so word
 * order, commas and repeated words don't matter.
 */
export async function fetchPlaces(params?: PlaceListParams): Promise<PlaceListResponse> {
  const limit = params?.limit ?? 20;
  const offset = params?.offset ?? 0;

  const query = new URLSearchParams();
  query.set("limit", String(limit));
  query.set("offset", String(offset));
  if (params?.search?.trim()) query.set("search", params.search.trim());
  if (params?.placeType) query.set("placeType", params.placeType);
  if (params?.categoryId) query.set("categoryId", params.categoryId);
  if (params?.isActive !== undefined) query.set("isActive", String(params.isActive));
  if (params?.isVisible !== undefined) query.set("isVisible", String(params.isVisible));
  if (params?.reviewStatus) query.set("reviewStatus", params.reviewStatus);
  if (params?.aiDecision) query.set("aiDecision", params.aiDecision);
  if (params?.staleDays !== undefined) query.set("staleDays", String(params.staleDays));
  if (params?.missingCategory !== undefined) query.set("missingCategory", String(params.missingCategory));
  if (params?.missingCoordinates !== undefined) query.set("missingCoordinates", String(params.missingCoordinates));
  if (params?.channel) query.set("channel", params.channel);
  if (params?.channelId) query.set("channelId", params.channelId);

  try {
    const res = await apiFetch(`${API_ENDPOINT}?${query.toString()}`);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return (await res.json()) as PlaceListResponse;
  } catch (cause) {
    console.warn("fetchPlaces failed:", cause);
    return { data: [], total: 0, limit, offset };
  }
}

/** POST /api/v1/places — create a new place. Throws on failure so the form can show the real error. */
export async function createPlace(request: CreatePlaceRequest): Promise<PlaceDetail> {
  const res = await apiFetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
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
  return res.json();
}
