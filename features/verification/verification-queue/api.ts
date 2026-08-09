import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type { VerificationQueueParams, VerificationQueueResponse } from "./types";

// Real endpoint: PlaceForge's place module, filtered to the review queue.
// GET /api/v1/places?reviewStatus=NEEDS_REVIEW
export const API_ENDPOINT = `${API_BASE_URL}/api/v1/places`;

const emptyResponse: VerificationQueueResponse = { data: [], total: 0, limit: 50, offset: 0 };

export async function fetchVerificationQueue(
  params?: VerificationQueueParams,
): Promise<VerificationQueueResponse> {
  const query = new URLSearchParams({ reviewStatus: "NEEDS_REVIEW" });
  const pageSize = params?.pageSize ?? 50;
  query.set("limit", String(pageSize));
  if (params?.page) query.set("offset", String((params.page - 1) * pageSize));

  try {
    const res = await apiFetch(`${API_ENDPOINT}?${query.toString()}`);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to empty data for fetchVerificationQueue:", cause);
    return emptyResponse;
  }
}
