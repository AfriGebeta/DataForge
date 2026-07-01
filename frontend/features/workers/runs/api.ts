import type { RunsParams, RunsResponse } from './types';

/** Planned endpoint: /api/workers/runs */
export const API_ENDPOINT = '/api/workers/runs' as const;

export async function fetchRuns(
  _params?: RunsParams,
): Promise<RunsResponse> {
  // TODO: replace with fetch(API_ENDPOINT, ...) when backend is ready
  return { items: [], total: 0 };
}
