/**
 * Matches PlaceForge's place-comment module contract exactly
 * (place-comment/api/v1/model.go). One comment per (placeId, userId) —
 * the DB enforces UNIQUE(placeId, userId), so a second create for the
 * same pair 409s.
 */
export type PlaceComment = {
  id: string;
  placeId: string;
  userId: string;
  body: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type CommentsParams = {
  limit?: number;
  offset?: number;
  placeId?: string;
};

export type CommentsResponse = {
  data: PlaceComment[];
  total: number;
  limit: number;
  offset: number;
};

export type CreateCommentRequest = {
  placeId: string;
  userId: string;
  body: string;
  photoUrl?: string;
};

export type UpdateCommentRequest = {
  body?: string;
  photoUrl?: string;
};
