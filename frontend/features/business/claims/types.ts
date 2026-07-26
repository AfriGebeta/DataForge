export type ClaimStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type BusinessClaim = {
  id: string;
  placeId: string;
  placeName: string | null;
  userId: string;
  userFullName: string | null;
  userEmail: string | null;
  userPhone: string | null;
  status: ClaimStatus;
  notes: string | null;
  reviewerId: string | null;
  placeManagerId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClaimsParams = {
  page?: number;
  pageSize?: number;
  status?: ClaimStatus;
};

export type ClaimsResponse = {
  data: BusinessClaim[];
  total: number;
  limit: number;
  offset: number;
};

export type RejectClaimRequest = {
  reason?: string;
};
