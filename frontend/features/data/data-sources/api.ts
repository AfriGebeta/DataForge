import type { DataSourcesParams, DataSourcesResponse } from './types';

/** Planned endpoint: /api/data/sources */
export const API_ENDPOINT = '/api/data/sources' as const;

export async function fetchDataSources(
  _params?: DataSourcesParams,
): Promise<DataSourcesResponse> {
  // TODO: replace with fetch(API_ENDPOINT, ...) when backend is ready
  return { items: [], total: 0 };
}
