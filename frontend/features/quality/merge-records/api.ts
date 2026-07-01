import type { MergeRecordsParams, MergeRecordsResponse } from './types';

/** Planned endpoint: /api/quality/merges */
export const API_ENDPOINT = '/api/quality/merges' as const;

export async function fetchMergeRecords(
  _params?: MergeRecordsParams,
): Promise<MergeRecordsResponse> {
  // TODO: replace with fetch(API_ENDPOINT, ...) when backend is ready
  return { items: [], total: 0 };
}
