import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";

import type { FieldConfig, PreviewResult, ReplaceAllJob } from "./types";

// Real endpoints: PlaceForge's geosync module. See
// /FORGE_TO_GOSCHEMA_SYNC.md's "New endpoints (PlaceForge)" table.
const BASE = `${API_BASE_URL}/api/v1/geo-sync`;

async function readErrorMessage(res: Response): Promise<string> {
  const data = await res.json().catch(() => null);
  return (
    data?.details?.internal ||
    data?.error ||
    `Request failed with status ${res.status}`
  );
}

export async function fetchFieldConfig(): Promise<FieldConfig> {
  const res = await apiFetch(`${BASE}/field-config`);
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return res.json();
}

export async function saveFieldConfig(template: string): Promise<FieldConfig> {
  const res = await apiFetch(`${BASE}/field-config`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ template }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return res.json();
}

export async function previewFieldConfig(
  template: string,
  placeId?: number
): Promise<PreviewResult> {
  const res = await apiFetch(`${BASE}/field-config/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      template,
      place_id: placeId,
    }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return res.json();
}

export async function startReplaceAll(): Promise<ReplaceAllJob> {
  const res = await apiFetch(`${BASE}/replace-all`, { method: "POST" });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return res.json();
}

export async function fetchReplaceAllJob(id: string): Promise<ReplaceAllJob> {
  const res = await apiFetch(`${BASE}/replace-all/${id}`);
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return res.json();
}

export async function fetchReplaceAllJobs(limit = 5): Promise<ReplaceAllJob[]> {
  const res = await apiFetch(`${BASE}/replace-all?limit=${limit}`);
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return res.json();
}
