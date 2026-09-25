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
  const query = new URLSearchParams();
  // Missing category/coordinates is a data-quality problem, not a review-
  // status one — a place already reviewStatus=COMPLETED can still be
  // missing both. Scoping to NEEDS_REVIEW would hide it from the one page
  // meant to let an admin go fix it, so either filter drops that scope
  // entirely instead of ANDing with it. Default (neither set) keeps the
  // queue's normal NEEDS_REVIEW behavior.
  if (params?.missingCategory || params?.missingCoordinates) {
    if (params.missingCategory) query.set("missingCategory", "true");
    if (params.missingCoordinates) query.set("missingCoordinates", "true");
  } else {
    query.set("reviewStatus", "NEEDS_REVIEW");
  }
  const pageSize = params?.pageSize ?? 50;
  query.set("limit", String(pageSize));
  if (params?.page) query.set("offset", String((params.page - 1) * pageSize));
  if (params?.assignedToId) query.set("assignedToId", params.assignedToId);
  if (params?.unassigned) query.set("unassigned", "true");

  try {
    const res = await apiFetch(`${API_ENDPOINT}?${query.toString()}`);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to empty data for fetchVerificationQueue:", cause);
    return emptyResponse;
  }
}

// PATCH /api/v1/places/bulk-assign — assignedToId: null unassigns.
export async function bulkAssignPlaces(placeIds: number[], assignedToId: string | null): Promise<void> {
  const res = await apiFetch(`${API_ENDPOINT}/bulk-assign`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ placeIds, assignedToId }),
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
}

export type CurrentAdmin = {
  adminId: string;
  userType: string;
  permissionLevel: string;
};

// GET /api/v1/admin/me — used to resolve "assigned to me".
export async function fetchCurrentAdmin(): Promise<CurrentAdmin | null> {
  try {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/admin/me`);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to null for fetchCurrentAdmin:", cause);
    return null;
  }
}
