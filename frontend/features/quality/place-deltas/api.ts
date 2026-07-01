import type { PlaceDeltasParams, PlaceDeltasResponse } from './types';

/** Planned endpoint: /api/quality/deltas */
export const API_ENDPOINT = '/api/quality/deltas' as const;

export async function fetchPlaceDeltas(
  _params?: PlaceDeltasParams,
): Promise<PlaceDeltasResponse> {
  // TODO: replace with fetch(API_ENDPOINT, ...) when backend is ready
  return { items: [], total: 0 };
}
