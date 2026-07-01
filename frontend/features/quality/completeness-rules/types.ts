/** Domain types for completeness-rules — align with backend contracts. */

export type CompletenessRulesParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type CompletenessRulesResponse = {
  items: unknown[];
  total: number;
};
