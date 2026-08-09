import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type {
  AdminLevelChainItem,
  AdminLevelInput,
  PlaceDetail,
  PlaceFlag,
  ReviewDecision,
  UpdatePlacePayload,
} from "./types";

export const PLACES_ENDPOINT = `${API_BASE_URL}/api/v1/places`;
export const ADDRESSES_ENDPOINT = `${API_BASE_URL}/api/v1/addresses`;
export const FLAGS_ENDPOINT = `${API_BASE_URL}/api/v1/flags`;

export async function fetchPlace(id: number): Promise<PlaceDetail | null> {
  try {
    const res = await apiFetch(`${PLACES_ENDPOINT}/${id}`);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("fetchPlace failed:", cause);
    return null;
  }
}

export async function updatePlace(id: number, patch: UpdatePlacePayload): Promise<PlaceDetail | null> {
  try {
    const res = await apiFetch(`${PLACES_ENDPOINT}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("updatePlace failed:", cause);
    return null;
  }
}

// "reject" does not delete the place — PlaceForge has no DELETE endpoint for
// Place. It marks the review resolved but leaves the record hidden.
export async function reviewPlace(
  id: number,
  decision: ReviewDecision,
  reason?: string,
  reviewedBy?: string,
): Promise<PlaceDetail | null> {
  try {
    const res = await apiFetch(`${PLACES_ENDPOINT}/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, reason, reviewedBy }),
    });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("reviewPlace failed:", cause);
    return null;
  }
}

// Marks a place as freshly re-verified without changing any of its fields —
// distinct from updatePlace, which also bumps refreshedAt as a side effect
// of an actual edit. Use this when an admin re-checked the source and
// confirmed the place is still accurate as-is.
export async function refreshPlace(id: number): Promise<PlaceDetail | null> {
  try {
    const res = await apiFetch(`${PLACES_ENDPOINT}/${id}/refresh`, { method: "POST" });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("refreshPlace failed:", cause);
    return null;
  }
}

export async function fetchPlaceFlags(placeId: number): Promise<PlaceFlag[]> {
  try {
    const res = await apiFetch(`${FLAGS_ENDPOINT}?place_id=${placeId}&limit=20`);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    const body: { data: PlaceFlag[] } = await res.json();
    return body.data;
  } catch (cause) {
    console.warn("fetchPlaceFlags failed:", cause);
    return [];
  }
}

export async function resolveFlag(id: string, resolvedBy: string): Promise<boolean> {
  try {
    const res = await apiFetch(`${FLAGS_ENDPOINT}/${id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved_by: resolvedBy }),
    });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return true;
  } catch (cause) {
    console.warn("resolveFlag failed:", cause);
    return false;
  }
}

export async function fetchAdminLevelChain(addressId: string): Promise<AdminLevelChainItem[]> {
  try {
    const res = await apiFetch(`${ADDRESSES_ENDPOINT}/${addressId}/admin-levels`);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    const body: { data: AdminLevelChainItem[] } = await res.json();
    return body.data;
  } catch (cause) {
    console.warn("fetchAdminLevelChain failed:", cause);
    return [];
  }
}

// Upserts the whole chain (create-if-absent, replace otherwise) — matches
// PlaceForge's PUT /addresses/{addressId}/admin-levels semantics.
export async function saveAdminLevelChain(
  addressId: string,
  levels: AdminLevelInput[],
): Promise<AdminLevelChainItem[] | null> {
  try {
    const res = await apiFetch(`${ADDRESSES_ENDPOINT}/${addressId}/admin-levels`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ levels }),
    });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    const body: { data: AdminLevelChainItem[] } = await res.json();
    return body.data;
  } catch (cause) {
    console.warn("saveAdminLevelChain failed:", cause);
    return null;
  }
}
