/** Domain types for place-deltas — align with backend contracts. */

export type PlaceDeltasParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type PlaceDeltasResponse = {
  items: unknown[];
  total: number;
};
