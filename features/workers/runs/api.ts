import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type { RunsParams, RunsResponse, RunStats } from "./types";

// Real endpoint: PlaceForge's worker module.
export const API_ENDPOINT = `${API_BASE_URL}/api/v1/runs`;

export async function fetchRuns(params?: RunsParams): Promise<RunsResponse> {
  const query = new URLSearchParams();
  query.set("limit", String(params?.limit ?? 100));
  query.set("offset", String(params?.offset ?? 0));
  if (params?.status) query.set("status", params.status);
  if (params?.channelConfigId) query.set("channel_config_id", params.channelConfigId);

  const res = await apiFetch(`${API_ENDPOINT}?${query.toString()}`);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return res.json();
}

export async function fetchRunStats(channelConfigId?: string): Promise<RunStats> {
  const query = channelConfigId ? `?channel_config_id=${channelConfigId}` : "";
  const res = await apiFetch(`${API_ENDPOINT}/stats${query}`);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return res.json();
}
