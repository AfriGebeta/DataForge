import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type { RatingsParams, RatingsResponse } from "./types";

export const API_ENDPOINT = `${API_BASE_URL}/api/v1/ratings`;

async function extractErrorMessage(res: Response): Promise<string> {
  let msg = `Request failed with status ${res.status}`;
  try {
    const body = await res.json();
    if (body?.error) msg = body.error;
  } catch {
    // ignore non-JSON error bodies
  }
  return msg;
}

export async function fetchRatings(params?: RatingsParams): Promise<RatingsResponse> {
  const query = new URLSearchParams();
  query.set("limit", String(params?.limit ?? 20));
  query.set("offset", String(params?.offset ?? 0));
  if (params?.placeId) query.set("placeId", params.placeId);

  const res = await apiFetch(`${API_ENDPOINT}?${query.toString()}`);
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
}

export async function deleteRating(id: string): Promise<void> {
  const res = await apiFetch(`${API_ENDPOINT}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
}
