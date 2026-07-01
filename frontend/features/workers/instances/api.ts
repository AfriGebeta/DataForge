import type { InstancesParams, InstancesResponse } from './types';

/** Planned endpoint: /api/workers/instances */
export const API_ENDPOINT = '/api/workers/instances' as const;

export async function fetchInstances(
  _params?: InstancesParams,
): Promise<InstancesResponse> {
  // TODO: replace with fetch(API_ENDPOINT, ...) when backend is ready
  return { items: [], total: 0 };
}
