/**
 * Matches PlaceForge's rating module contract exactly (rating/api/v1/model.go).
 * Ratings are submitted only by the external map-app — this admin surface is
 * read + delete (moderation), never create/edit.
 */
export type Rating = {
  id: string;
  placeId: string;
  userId: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
};

export type RatingsParams = {
  limit?: number;
  offset?: number;
  placeId?: string;
};

export type RatingsResponse = {
  data: Rating[];
  total: number;
  limit: number;
  offset: number;
};
