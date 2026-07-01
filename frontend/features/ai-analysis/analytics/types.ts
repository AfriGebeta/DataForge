/** Domain types for analytics — align with backend contracts. */

export type AnalyticsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type AnalyticsResponse = {
  items: unknown[];
  total: number;
};
