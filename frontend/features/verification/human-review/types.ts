/** Domain types for human-review — align with backend contracts. */

export type HumanReviewParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type HumanReviewResponse = {
  items: unknown[];
  total: number;
};
