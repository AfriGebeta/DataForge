import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type { MergeDiff, MergeFieldResolution, MergeRecord, PlaceSummary } from "./types";

export const MERGES_ENDPOINT = `${API_BASE_URL}/api/v1/merges`;
export const PLACES_ENDPOINT = `${API_BASE_URL}/api/v1/places`;

// A place flagged aiDecision=DUPLICATE has a MergeRecord somewhere with it
// as either winner or loser (auto-detection always makes the *new*
// submission a candidate on one side) — check both, status=PENDING is the
// one still awaiting a human.
export async function fetchPendingMergeForPlace(placeId: number): Promise<MergeRecord | null> {
  try {
    const [asLoser, asWinner] = await Promise.all([
      apiFetch(`${MERGES_ENDPOINT}?loser_id=${placeId}&status=PENDING`).then((r) => (r.ok ? r.json() : null)),
      apiFetch(`${MERGES_ENDPOINT}?winner_id=${placeId}&status=PENDING`).then((r) => (r.ok ? r.json() : null)),
    ]);
    const fromLoser: MergeRecord[] = asLoser?.data ?? [];
    const fromWinner: MergeRecord[] = asWinner?.data ?? [];
    return fromLoser[0] ?? fromWinner[0] ?? null;
  } catch (cause) {
    console.warn("fetchPendingMergeForPlace failed:", cause);
    return null;
  }
}

export async function fetchMergeRecord(id: string): Promise<MergeRecord | null> {
  try {
    const res = await apiFetch(`${MERGES_ENDPOINT}/${id}`);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("fetchMergeRecord failed:", cause);
    return null;
  }
}

export async function fetchMergeDiff(id: string): Promise<MergeDiff | null> {
  try {
    const res = await apiFetch(`${MERGES_ENDPOINT}/${id}/diff`);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("fetchMergeDiff failed:", cause);
    return null;
  }
}

export async function fetchPlaceSummary(id: number): Promise<PlaceSummary | null> {
  try {
    const res = await apiFetch(`${PLACES_ENDPOINT}/${id}`);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("fetchPlaceSummary failed:", cause);
    return null;
  }
}

export async function applyMerge(
  id: string,
  fieldResolution: MergeFieldResolution,
  reviewedBy?: string,
): Promise<MergeRecord | null> {
  try {
    const res = await apiFetch(`${MERGES_ENDPOINT}/${id}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field_resolution: fieldResolution, reviewed_by: reviewedBy }),
    });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("applyMerge failed:", cause);
    return null;
  }
}

export async function rejectMerge(
  id: string,
  reviewedBy?: string,
  rejectionReason?: string,
): Promise<MergeRecord | null> {
  try {
    const res = await apiFetch(`${MERGES_ENDPOINT}/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewed_by: reviewedBy, rejection_reason: rejectionReason }),
    });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("rejectMerge failed:", cause);
    return null;
  }
}
