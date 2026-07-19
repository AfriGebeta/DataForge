import type { DuplicateDetectionParams, DuplicateDetectionResponse } from './types';

/** Planned endpoint: /api/verification/duplicates */
export const API_ENDPOINT = '/api/verification/duplicates' as const;

export async function fetchDuplicateDetection(
  _params?: DuplicateDetectionParams,
): Promise<DuplicateDetectionResponse> {
  // TODO: replace with fetch(API_ENDPOINT, ...) when backend is ready
  return { items: [], total: 0 };
}
