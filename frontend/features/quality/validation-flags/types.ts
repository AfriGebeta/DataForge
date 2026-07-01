/** Domain types for validation-flags — align with backend contracts. */

export type ValidationFlagsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type ValidationFlagsResponse = {
  items: unknown[];
  total: number;
};
