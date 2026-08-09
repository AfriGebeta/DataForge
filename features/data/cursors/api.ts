import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type { IngestCursor, UpsertCursorRequest } from "./types";

// Real endpoint: PlaceForge's ingest module, per-channel cursor sub-resource.
const CHANNELS_ENDPOINT = `${API_BASE_URL}/api/v1/channels`;

export async function fetchCursorsForChannel(channelConfigId: string): Promise<IngestCursor[]> {
  try {
    const res = await apiFetch(`${CHANNELS_ENDPOINT}/${channelConfigId}/cursors`);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to empty data for fetchCursorsForChannel:", cause);
    return [];
  }
}

export async function upsertCursor(
  channelConfigId: string,
  request: UpsertCursorRequest,
): Promise<IngestCursor> {
  const res = await apiFetch(`${CHANNELS_ENDPOINT}/${channelConfigId}/cursors`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`Advance cursor failed with status ${res.status}`);
  return res.json();
}

export async function resetCursor(channelConfigId: string, cursorKey: string): Promise<void> {
  const res = await apiFetch(
    `${CHANNELS_ENDPOINT}/${channelConfigId}/cursors/${encodeURIComponent(cursorKey)}`,
    { method: "DELETE" },
  );
  if (!res.ok) throw new Error(`Reset cursor failed with status ${res.status}`);
}

export async function resetAllCursors(channelConfigId: string): Promise<void> {
  const res = await apiFetch(`${CHANNELS_ENDPOINT}/${channelConfigId}/cursors`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Reset cursors failed with status ${res.status}`);
}
