import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type {
  ChannelsParams,
  ChannelsResponse,
  ChannelConfig,
  CreateChannelConfigRequest,
  UpdateChannelConfigRequest,
} from "./types";

// Real endpoint: PlaceForge's ingest module.
export const API_ENDPOINT = `${API_BASE_URL}/api/v1/channels`;

const emptyResponse: ChannelsResponse = { data: [], total: 0, limit: 50, offset: 0 };

export async function fetchChannels(
  params?: ChannelsParams,
): Promise<ChannelsResponse> {
  const query = new URLSearchParams();
  query.set("limit", String(params?.limit ?? 200));
  query.set("offset", String(params?.offset ?? 0));
  if (params?.activeOnly) query.set("active_only", "true");

  try {
    const res = await apiFetch(`${API_ENDPOINT}?${query.toString()}`);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to empty data for fetchChannels:", cause);
    return emptyResponse;
  }
}

export async function createChannelConfig(
  request: CreateChannelConfigRequest,
): Promise<ChannelConfig> {
  const res = await apiFetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`Create channel failed with status ${res.status}`);
  return res.json();
}

export async function updateChannelConfig(
  id: string,
  request: UpdateChannelConfigRequest,
): Promise<ChannelConfig> {
  const res = await apiFetch(`${API_ENDPOINT}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`Update channel failed with status ${res.status}`);
  return res.json();
}

export async function deleteChannelConfig(id: string): Promise<void> {
  const res = await apiFetch(`${API_ENDPOINT}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Delete channel failed with status ${res.status}`);
}
