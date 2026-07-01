/** Domain types for geographic-validation — align with backend contracts. */

export type GeographicValidationParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type GeographicValidationResponse = {
  items: unknown[];
  total: number;
};
