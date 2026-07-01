import type { AnalyticsParams, AnalyticsResponse } from './types';

/** Planned endpoint: /api/ai/analytics */
export const API_ENDPOINT = '/api/ai/analytics' as const;

export async function fetchAnalytics(
  _params?: AnalyticsParams,
): Promise<AnalyticsResponse> {
  // TODO: replace with fetch(API_ENDPOINT, ...) when backend is ready
  return { items: [], total: 0 };
}
