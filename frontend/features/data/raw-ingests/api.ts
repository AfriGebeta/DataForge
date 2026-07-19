import type { RawIngestsParams, RawIngestsResponse } from './types';

/** Planned endpoint: /api/data/ingests */
export const API_ENDPOINT = '/api/data/ingests' as const;

export async function fetchRawIngests(
  _params?: RawIngestsParams,
): Promise<RawIngestsResponse> {
  // TODO: replace with fetch(API_ENDPOINT, ...) when backend is ready
  return { items: [], total: 0 };
}
