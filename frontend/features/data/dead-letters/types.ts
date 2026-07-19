/** Domain types for dead-letters — align with backend contracts. */

export type DeadLettersParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type DeadLettersResponse = {
  items: unknown[];
  total: number;
};
