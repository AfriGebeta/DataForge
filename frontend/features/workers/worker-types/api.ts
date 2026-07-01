import type { WorkerTypesParams, WorkerTypesResponse } from './types';

/** Planned endpoint: /api/workers/types */
export const API_ENDPOINT = '/api/workers/types' as const;

export async function fetchWorkerTypes(
  _params?: WorkerTypesParams,
): Promise<WorkerTypesResponse> {
  // TODO: replace with fetch(API_ENDPOINT, ...) when backend is ready
  return { items: [], total: 0 };
}
