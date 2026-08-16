import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type { AnalyticsData } from "./types";

/** Real endpoint: PlaceForge's insights module. */
export const API_ENDPOINT = `${API_BASE_URL}/api/v1/insights/analytics`;

export async function fetchAnalytics(): Promise<AnalyticsData> {
  const res = await apiFetch(API_ENDPOINT);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return res.json();
}
