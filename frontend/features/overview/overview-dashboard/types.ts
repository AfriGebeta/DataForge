/** Domain types for overview-dashboard — align with backend contracts. */

export type OverviewDashboardParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type OverviewDashboardResponse = {
  items: unknown[];
  total: number;
};
