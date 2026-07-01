import type { CompletenessRulesParams, CompletenessRulesResponse } from './types';

/** Planned endpoint: /api/quality/rules */
export const API_ENDPOINT = '/api/quality/rules' as const;

export async function fetchCompletenessRules(
  _params?: CompletenessRulesParams,
): Promise<CompletenessRulesResponse> {
  // TODO: replace with fetch(API_ENDPOINT, ...) when backend is ready
  return { items: [], total: 0 };
}
