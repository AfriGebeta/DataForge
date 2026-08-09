export type ClaimStatus = "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "REVOKED";
export type VerificationMethod =
  | "EMAIL_DOMAIN" | "PHONE_CALL" | "DOCUMENT_UPLOAD" | "MANUAL_ADMIN" | "GOOGLE_VERIFIED";

/** Matches PlaceForge's BusinessClaimResponse (business/api/v1/model.go) exactly. */
export type BusinessClaim = {
  id: string;
  placeId: string;
  userId: string;
  status: ClaimStatus;
  claimEmail?: string;
  claimPhone?: string;
  contactName?: string;
  jobTitle?: string;
  verificationMethod?: VerificationMethod;
  reviewerId?: string;
  reviewSource?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  placeManagerId?: string;
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

export type ApproveClaimRequest = {
  reviewerId: string;
  reviewSource: string;
};

export type RejectClaimRequest = {
  reviewerId: string;
  reviewSource: string;
  reason: string;
};
