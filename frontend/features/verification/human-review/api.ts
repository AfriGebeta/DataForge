import type { HumanReviewParams, HumanReviewResponse } from './types';

/** Planned endpoint: /api/verification/review */
export const API_ENDPOINT = '/api/verification/review' as const;

export async function fetchHumanReview(
  _params?: HumanReviewParams,
): Promise<HumanReviewResponse> {
  // TODO: replace with fetch(API_ENDPOINT, ...) when backend is ready
  return { items: [], total: 0 };
}
