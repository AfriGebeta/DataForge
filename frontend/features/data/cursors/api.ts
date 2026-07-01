import type { CursorsParams, CursorsResponse } from './types';

/** Planned endpoint: /api/data/cursors */
export const API_ENDPOINT = '/api/data/cursors' as const;

export async function fetchCursors(
  _params?: CursorsParams,
): Promise<CursorsResponse> {
  // TODO: replace with fetch(API_ENDPOINT, ...) when backend is ready
  return { items: [], total: 0 };
}
