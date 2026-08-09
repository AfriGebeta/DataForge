import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type {
  ApproveClaimRequest,
  BusinessClaim,
  ClaimsParams,
  ClaimsResponse,
  RejectClaimRequest,
} from "./types";

export const API_ENDPOINT = `${API_BASE_URL}/api/v1/claims`;

/**
 * PlaceForge's approve/reject endpoints require a reviewerId + reviewSource
 * identity, but this app never threads a logged-in admin's identity past the
 * login page (no Authorization header sent on any other request). Same
 * convention as features/quality/validation-flags' resolved_by default.
 */
const DEFAULT_REVIEWER_ID = "dataforge-ui";
const DEFAULT_REVIEW_SOURCE = "admin_dashboard";

export async function fetchClaims(params?: ClaimsParams): Promise<ClaimsResponse> {
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 20;

  const query = new URLSearchParams();
  query.set("limit", String(pageSize));
  query.set("offset", String((page - 1) * pageSize));
  if (params?.status) query.set("status", params.status);

  const res = await apiFetch(`${API_ENDPOINT}?${query.toString()}`);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return res.json();
}

export async function fetchClaim(id: string): Promise<BusinessClaim> {
  const res = await apiFetch(`${API_ENDPOINT}/${id}`);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return res.json();
}

export async function approveClaim(id: string): Promise<void> {
  const body: ApproveClaimRequest = {
    reviewerId: DEFAULT_REVIEWER_ID,
    reviewSource: DEFAULT_REVIEW_SOURCE,
  };
  const res = await apiFetch(`${API_ENDPOINT}/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
}

export async function rejectClaim(id: string, reason?: string): Promise<void> {
  const body: RejectClaimRequest = {
    reviewerId: DEFAULT_REVIEWER_ID,
    reviewSource: DEFAULT_REVIEW_SOURCE,
    reason: reason ?? "",
  };
  const res = await apiFetch(`${API_ENDPOINT}/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
}

export async function cancelClaim(id: string): Promise<void> {
  const res = await apiFetch(`${API_ENDPOINT}/${id}/cancel`, { method: "POST" });
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
}
