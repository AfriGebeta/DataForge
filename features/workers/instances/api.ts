import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type { InstancesParams, InstancesResponse } from "./types";

// Real endpoint: PlaceForge's worker module.
export const API_ENDPOINT = `${API_BASE_URL}/api/v1/instances`;

export async function fetchInstances(
  params?: InstancesParams,
): Promise<InstancesResponse> {
  const query = new URLSearchParams();
  query.set("limit", String(params?.limit ?? 100));
  query.set("offset", String(params?.offset ?? 0));
  if (params?.status) query.set("status", params.status);
  if (params?.workerId) query.set("worker_id", params.workerId);

  const res = await apiFetch(`${API_ENDPOINT}?${query.toString()}`);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return res.json();
}

export async function drainInstance(id: string): Promise<void> {
  const res = await apiFetch(`${API_ENDPOINT}/${id}/drain`, { method: "POST" });
  if (!res.ok) throw new Error(`Drain failed with status ${res.status}`);
}

export async function stopInstance(id: string): Promise<void> {
  const res = await apiFetch(`${API_ENDPOINT}/${id}/stop`, { method: "POST" });
  if (!res.ok) throw new Error(`Stop failed with status ${res.status}`);
}

/** Returns the number of stale instances the health-monitor sweep marked DEAD. */
export async function sweepStaleInstances(thresholdSeconds?: number): Promise<number> {
  const query = thresholdSeconds ? `?threshold_seconds=${thresholdSeconds}` : "";
  const res = await apiFetch(`${API_ENDPOINT}/sweep${query}`, { method: "POST" });
  if (!res.ok) throw new Error(`Sweep failed with status ${res.status}`);
  const body: { marked_dead: number } = await res.json();
  return body.marked_dead;
}
