/** Domain types for schemas — align with backend contracts. */

export type SchemasParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type SchemasResponse = {
  items: unknown[];
  total: number;
};
