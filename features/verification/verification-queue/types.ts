/**
 * Domain types for verification-queue — mirrors PlaceForge's
 * `PlaceListItem` response (place module, camelCase JSON — NOT the
 * snake_case convention used by data-quality endpoints like /flags).
 * See DataForge/frontend/features/verification/INTEGRATION.md for the
 * full field-by-field mapping.
 */

export type ReviewStatus = "COMPLETED" | "NEEDS_REVIEW";
export type AIDecision = "VALID" | "INVALID" | "AMBIGUOUS" | "DUPLICATE";

export type PlaceName = {
  languageCode: string;
  name: string;
  nameType: string;
  isPrimary: boolean;
};

export type AIValues = {
  aiGeoValid?: boolean;
  aiGeoScore?: number;
  aiNameValid?: boolean;
  aiNameScore?: number;
  aiLanguageValid?: boolean;
  aiDuplicateScore?: number;
  aiMlConfidence?: number;
  aiOverallScore?: number;
  aiDecision?: AIDecision;
  aiReasons?: string[];
  aiValidatedAt?: string;
};

export type QueuedPlace = {
  id: number;
  placeType: string;
  categoryId?: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  isVisible: boolean;
  reviewStatus: ReviewStatus;
  reviewReason?: string;
  assignedToId?: string;
  assignedAt?: string;
  completenessLevel: string;
  names: PlaceName[];
  aiValues?: AIValues;
  createdAt: string;
};

export type VerificationQueueParams = {
  page?: number;
  pageSize?: number;
  // Mutually exclusive: set one or neither, never both.
  assignedToId?: string;
  unassigned?: boolean;
};

export type VerificationQueueResponse = {
  data: QueuedPlace[];
  total: number;
  limit: number;
  offset: number;
};
