import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type {
  IngestStatsResponse,
  IngestStatus,
  RawIngestsParams,
  RawIngestsResponse,
  SubmitIngestRequest,
} from "./types";

// Real endpoint: PlaceForge's ingest module.
export const API_ENDPOINT = `${API_BASE_URL}/api/v1/ingests`;

const emptyResponse: RawIngestsResponse = { data: [], total: 0, limit: 50, offset: 0 };

export async function fetchRawIngests(
  params?: RawIngestsParams,
): Promise<RawIngestsResponse> {
  const query = new URLSearchParams();
  query.set("limit", String(params?.limit ?? 50));
  query.set("offset", String(params?.offset ?? 0));
  if (params?.status) query.set("status", params.status);
  if (params?.channel) query.set("channel", params.channel);

  try {
    const res = await apiFetch(`${API_ENDPOINT}?${query.toString()}`);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to empty data for fetchRawIngests:", cause);
    return emptyResponse;
  }
}

export async function fetchIngestStats(channel?: string): Promise<IngestStatsResponse> {
  const query = new URLSearchParams();
  if (channel) query.set("channel", channel);

  try {
    const res = await apiFetch(`${API_ENDPOINT}/stats?${query.toString()}`);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to empty stats for fetchIngestStats:", cause);
    return { counts: {} };
  }
}

export async function submitIngest(request: SubmitIngestRequest): Promise<void> {
  const res = await apiFetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Submit ingest failed with status ${res.status}`);
  }
}

export async function retryIngest(id: string): Promise<void> {
  const res = await apiFetch(`${API_ENDPOINT}/${id}/retry`, { method: "POST" });
  if (!res.ok) throw new Error(`Retry failed with status ${res.status}`);
}

export async function updateIngestStatus(id: string, status: IngestStatus): Promise<void> {
  const res = await apiFetch(`${API_ENDPOINT}/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`Status update failed with status ${res.status}`);
}

export async function bulkUpdateStatus(ids: string[], status: IngestStatus): Promise<void> {
  const res = await apiFetch(`${API_ENDPOINT}/bulk-status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, status }),
  });
  if (!res.ok) throw new Error(`Bulk update failed with status ${res.status}`);
}
