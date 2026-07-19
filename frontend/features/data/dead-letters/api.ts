import type { DeadLettersParams, DeadLettersResponse } from './types';

/** Planned endpoint: /api/data/dead-letters */
export const API_ENDPOINT = '/api/data/dead-letters' as const;

export async function fetchDeadLetters(
  _params?: DeadLettersParams,
): Promise<DeadLettersResponse> {
  // TODO: replace with fetch(API_ENDPOINT, ...) when backend is ready
  return { items: [], total: 0 };
}
