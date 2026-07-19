import type { OverviewDashboardParams, OverviewDashboardResponse } from './types';

/** Planned endpoint: /api/overview/dashboard */
export const API_ENDPOINT = '/api/overview/dashboard' as const;

export async function fetchOverviewDashboard(
  _params?: OverviewDashboardParams,
): Promise<OverviewDashboardResponse> {
  // TODO: replace with fetch(API_ENDPOINT, ...) when backend is ready
  return { items: [], total: 0 };
}
