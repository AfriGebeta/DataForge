/**
 * Matches PlaceForge's place-vibe-tag module contract exactly
 * (place-vibe-tag/api/v1/model.go). Unlike Place Sources, vibe tags are
 * AI-extracted from source text (rawSnippet/confidence/mentionCount), not
 * hand-entered — placeId is numeric (Place.id), placeSourceId optionally
 * links back to the Place Source it was mined from.
 */
export type VibeTag = {
  id: string;
  placeId: string;
  tag: string;
  confidence: number;
  mentionCount: number;
  rawSnippet?: string;
  language?: string;
  placeSourceId?: string;
  createdAt: string;
  updatedAt: string;
};

export type VibeTagsParams = {
  limit?: number;
  offset?: number;
  placeId?: string;
};

export type VibeTagsResponse = {
  data: VibeTag[];
  total: number;
  limit: number;
  offset: number;
};

export type CreateVibeTagRequest = {
  placeId: string;
  tag: string;
  confidence: number;
  mentionCount?: number;
  rawSnippet?: string;
  language?: string;
  placeSourceId?: string;
};

export type UpdateVibeTagRequest = {
  tag?: string;
  confidence?: number;
  mentionCount?: number;
  rawSnippet?: string;
  language?: string;
  placeSourceId?: string;
};
