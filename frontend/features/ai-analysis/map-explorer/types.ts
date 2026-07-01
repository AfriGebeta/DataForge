/** Domain types for map-explorer — align with backend contracts. */

export type MapExplorerParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type MapExplorerResponse = {
  items: unknown[];
  total: number;
};
