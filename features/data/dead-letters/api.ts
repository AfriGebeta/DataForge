import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type { DeadLettersParams, DeadLettersResponse } from "./types";

// Real endpoint: PlaceForge's ingest module.
export const API_ENDPOINT = `${API_BASE_URL}/api/v1/dlq`;

const emptyResponse: DeadLettersResponse = { data: [], total: 0, limit: 50, offset: 0 };

export async function fetchDeadLetters(
  params?: DeadLettersParams,
): Promise<DeadLettersResponse> {
  const query = new URLSearchParams();
  query.set("limit", String(params?.limit ?? 50));
  query.set("offset", String(params?.offset ?? 0));
  if (params?.queue) query.set("queue", params.queue);
  if (params?.replayed !== undefined) query.set("replayed", String(params.replayed));

  try {
    const res = await apiFetch(`${API_ENDPOINT}?${query.toString()}`);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to empty data for fetchDeadLetters:", cause);
    return emptyResponse;
  }
}

export async function replayDeadLetter(id: string): Promise<void> {
  const res = await apiFetch(`${API_ENDPOINT}/${id}/replay`, { method: "POST" });
  if (!res.ok) throw new Error(`Replay failed with status ${res.status}`);
}
