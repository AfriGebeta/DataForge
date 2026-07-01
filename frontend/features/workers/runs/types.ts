/** Domain types for runs — align with backend contracts. */

export type RunsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type RunsResponse = {
  items: unknown[];
  total: number;
};
