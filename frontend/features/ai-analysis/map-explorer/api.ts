import type { MapExplorerParams, MapExplorerResponse } from './types';

/** Planned endpoint: /api/ai/map */
export const API_ENDPOINT = '/api/ai/map' as const;

export async function fetchMapExplorer(
  _params?: MapExplorerParams,
): Promise<MapExplorerResponse> {
  // TODO: replace with fetch(API_ENDPOINT, ...) when backend is ready
  return { items: [], total: 0 };
}
