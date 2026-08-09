import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type { SettingsData } from "./types";

/** Real endpoint: PlaceForge's system module. */
export const API_ENDPOINT = `${API_BASE_URL}/api/v1/settings`;

export async function fetchSettings(): Promise<SettingsData> {
  const res = await apiFetch(API_ENDPOINT);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return res.json();
}

export async function saveSettings(data: SettingsData): Promise<SettingsData> {
  const res = await apiFetch(API_ENDPOINT, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    let msg = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(msg);
  }
  return res.json();
}