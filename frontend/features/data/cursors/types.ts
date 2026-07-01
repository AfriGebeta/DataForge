/** Domain types for cursors — align with backend contracts. */

export type CursorsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type CursorsResponse = {
  items: unknown[];
  total: number;
};
