/** Domain types for data-sources — align with backend contracts. */

export type DataSourcesParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type DataSourcesResponse = {
  items: unknown[];
  total: number;
};
