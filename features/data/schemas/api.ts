import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type {
  CreateWorkerSchemaRequest,
  SchemasParams,
  UpdateWorkerSchemaRequest,
  WorkerSchema,
} from "./types";

// Real endpoint: PlaceForge's ingest module.
export const API_ENDPOINT = `${API_BASE_URL}/api/v1/schemas`;

export async function fetchSchemas(params?: SchemasParams): Promise<WorkerSchema[]> {
  const query = new URLSearchParams();
  if (params?.activeOnly) query.set("active_only", "true");

  try {
    const res = await apiFetch(`${API_ENDPOINT}?${query.toString()}`);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to empty data for fetchSchemas:", cause);
    return [];
  }
}

export async function createWorkerSchema(
  request: CreateWorkerSchemaRequest,
): Promise<WorkerSchema> {
  const res = await apiFetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`Create schema failed with status ${res.status}`);
  return res.json();
}

export async function updateWorkerSchema(
  id: string,
  request: UpdateWorkerSchemaRequest,
): Promise<WorkerSchema> {
  const res = await apiFetch(`${API_ENDPOINT}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`Update schema failed with status ${res.status}`);
  return res.json();
}

export async function deleteWorkerSchema(id: string): Promise<void> {
  const res = await apiFetch(`${API_ENDPOINT}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Delete schema failed with status ${res.status}`);
}
