import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type { CreateWorkerTypeRequest, WorkerType } from "./types";

// Real endpoint: PlaceForge's worker module.
export const API_ENDPOINT = `${API_BASE_URL}/api/v1/workers`;

/** GET /api/v1/workers returns a bare array, no pagination envelope. */
export async function fetchWorkerTypes(): Promise<WorkerType[]> {
  const res = await apiFetch(API_ENDPOINT);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return res.json();
}

/** Also how a deactivated worker type is reactivated — POST upserts by name. */
export async function createWorkerType(
  request: CreateWorkerTypeRequest,
): Promise<WorkerType> {
  const res = await apiFetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`Register worker failed with status ${res.status}`);
  return res.json();
}

/**
 * There is no dedicated "activate" route — DELETE only deactivates.
 * Reactivating re-registers the worker via the same upsert-by-name POST.
 */
export async function setWorkerTypeActive(
  worker: WorkerType,
  isActive: boolean,
): Promise<WorkerType> {
  if (!isActive) {
    const res = await apiFetch(`${API_ENDPOINT}/${worker.id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Deactivate worker failed with status ${res.status}`);
    return { ...worker, is_active: false };
  }
  return createWorkerType({
    name: worker.name,
    version: worker.version,
    capabilities: worker.capabilities,
    max_concurrency: worker.max_concurrency,
    is_active: true,
  });
}
