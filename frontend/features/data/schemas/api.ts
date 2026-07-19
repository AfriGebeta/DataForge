import type { SchemasParams, SchemasResponse } from './types';

/** Planned endpoint: /api/data/schemas */
export const API_ENDPOINT = '/api/data/schemas' as const;

export async function fetchSchemas(
  _params?: SchemasParams,
): Promise<SchemasResponse> {
  // TODO: replace with fetch(API_ENDPOINT, ...) when backend is ready
  return { items: [], total: 0 };
}
