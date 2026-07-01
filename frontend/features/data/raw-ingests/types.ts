/** Domain types for raw-ingests — align with backend contracts. */

export type RawIngestsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type RawIngestsResponse = {
  items: unknown[];
  total: number;
};
