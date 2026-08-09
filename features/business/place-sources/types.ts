/**
 * Matches PlaceForge's business module Place Source contract exactly
 * (business/api/v1/model.go). placeId is numeric — it references Place.id
 * (BigInt), not a UUID, despite place_source.id itself being a UUID.
 */
export type SourceType =
  | "OSM" | "WIKIDATA" | "WIKIPEDIA" | "GEONAMES" | "GOVERNMENT"
  | "MUNICIPALITY" | "USER_SUBMISSION" | "PARTNER_IMPORT" | "MANUAL_ENTRY"
  | "THIRD_PARTY" | "UNKNOWN";

export const SOURCE_TYPES: SourceType[] = [
  "OSM", "WIKIDATA", "WIKIPEDIA", "GEONAMES", "GOVERNMENT",
  "MUNICIPALITY", "USER_SUBMISSION", "PARTNER_IMPORT", "MANUAL_ENTRY",
  "THIRD_PARTY", "UNKNOWN",
];

export type PlaceSource = {
  id: string;
  placeId: string;
  sourceType: SourceType;
  sourceName?: string;
  sourceId?: string;
  sourceUrl?: string;
  fieldsContributed?: string[];
  confidenceScore: number;
  fetchedAt: string;
  isPrimary: boolean;
  rawResponse?: unknown;
  createdAt: string;
  updatedAt: string;
};

export type PlaceSourcesParams = {
  page?: number;
  limit?: number;
  placeId?: string;
};

export type PlaceSourcesPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type PlaceSourcesResponse = {
  data: PlaceSource[];
  pagination: PlaceSourcesPagination;
};

export type CreatePlaceSourceRequest = {
  placeId: string;
  sourceType: SourceType;
  sourceName?: string;
  sourceId?: string;
  sourceUrl?: string;
  fieldsContributed?: string[];
  confidenceScore?: number;
  isPrimary?: boolean;
};

export type UpdatePlaceSourceRequest = {
  sourceName?: string;
  sourceId?: string;
  sourceUrl?: string;
  fieldsContributed?: string[];
  confidenceScore?: number;
  isPrimary?: boolean;
};
