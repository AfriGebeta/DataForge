import type { VerificationQueueParams, VerificationQueueResponse } from './types';

/** Planned endpoint: /api/verification/queue */
export const API_ENDPOINT = '/api/verification/queue' as const;

export async function fetchVerificationQueue(
  _params?: VerificationQueueParams,
): Promise<VerificationQueueResponse> {
  // TODO: replace with fetch(API_ENDPOINT, ...) when backend is ready
  return { items: [], total: 0 };
}
