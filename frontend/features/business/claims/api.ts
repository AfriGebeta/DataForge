import type {
  BusinessClaim,
  ClaimsParams,
  ClaimsResponse,
  RejectClaimRequest,
} from "./types";

export const API_ENDPOINT = "http://localhost:8080/api/v1/claims" as const;

const fakeClaims: BusinessClaim[] = [
  {
    id: "clm-001",
    placeId: "place-001",
    placeName: "Kaldi's Coffee Bole",
    userId: "usr-001",
    userFullName: "Abebe Girma",
    userEmail: "abebe@example.com",
    userPhone: "+251911234567",
    status: "PENDING",
    notes: "I am the owner of this branch since 2018.",
    reviewerId: null,
    placeManagerId: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "clm-002",
    placeId: "place-002",
    placeName: "Tomoca Coffee",
    userId: "usr-002",
    userFullName: "Tigist Bekele",
    userEmail: "tigist@example.com",
    userPhone: null,
    status: "APPROVED",
    notes: null,
    reviewerId: "admin-001",
    placeManagerId: "pm-001",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "clm-003",
    placeId: "place-003",
    placeName: "Buna Hotel Addis",
    userId: "usr-003",
    userFullName: "Dawit Haile",
    userEmail: "dawit@example.com",
    userPhone: "+251922345678",
    status: "REJECTED",
    notes: "Cannot verify ownership documents provided.",
    reviewerId: "admin-001",
    placeManagerId: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
  },
  {
    id: "clm-004",
    placeId: "place-004",
    placeName: "Atlas Hotel",
    userId: "usr-004",
    userFullName: null,
    userEmail: "meron@example.com",
    userPhone: null,
    status: "PENDING",
    notes: null,
    reviewerId: null,
    placeManagerId: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "clm-005",
    placeId: "place-005",
    placeName: "Friendship Hotel",
    userId: "usr-005",
    userFullName: "Selam Tesfaye",
    userEmail: "selam@example.com",
    userPhone: "+251933456789",
    status: "CANCELLED",
    notes: null,
    reviewerId: null,
    placeManagerId: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
  },
];

export async function fetchClaims(params?: ClaimsParams): Promise<ClaimsResponse> {
  try {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const statusQuery = params?.status ? `&status=${params.status}` : "";
    const res = await fetch(
      `${API_ENDPOINT}?limit=${pageSize}&offset=${(page - 1) * pageSize}${statusQuery}`,
    );
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const start = (page - 1) * pageSize;
    const filtered = params?.status
      ? fakeClaims.filter((c) => c.status === params.status)
      : fakeClaims;
    return {
      data: filtered.slice(start, start + pageSize),
      total: filtered.length,
      limit: pageSize,
      offset: start,
    };
  }
}

export async function fetchClaim(id: string): Promise<BusinessClaim> {
  try {
    const res = await fetch(`${API_ENDPOINT}/${id}`);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch {
    const claim = fakeClaims.find((c) => c.id === id);
    if (!claim) throw new Error("Claim not found");
    return claim;
  }
}

export async function approveClaim(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_ENDPOINT}/${id}/approve`, { method: "POST" });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  } catch {
    const claim = fakeClaims.find((c) => c.id === id);
    if (claim) {
      claim.status = "APPROVED";
      claim.updatedAt = new Date().toISOString();
    }
  }
}

export async function rejectClaim(id: string, request?: RejectClaimRequest): Promise<void> {
  try {
    const res = await fetch(`${API_ENDPOINT}/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request ?? {}),
    });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  } catch {
    const claim = fakeClaims.find((c) => c.id === id);
    if (claim) {
      claim.status = "REJECTED";
      claim.updatedAt = new Date().toISOString();
    }
  }
}

export async function cancelClaim(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_ENDPOINT}/${id}/cancel`, { method: "POST" });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  } catch {
    const claim = fakeClaims.find((c) => c.id === id);
    if (claim) {
      claim.status = "CANCELLED";
      claim.updatedAt = new Date().toISOString();
    }
  }
}
