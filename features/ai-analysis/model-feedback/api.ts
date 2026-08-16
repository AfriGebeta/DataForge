import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type { ModelFeedbackData } from "./types";

/** Real endpoint: PlaceForge's insights module (place.ai* + audit_log + merge_record). */
export const API_ENDPOINT = `${API_BASE_URL}/api/v1/insights/model-feedback`;

export async function fetchModelFeedback(): Promise<ModelFeedbackData> {
  const res = await apiFetch(API_ENDPOINT);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return res.json();
}
