/** Domain types for duplicate-detection — align with backend contracts. */

export type DuplicateDetectionParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type DuplicateDetectionResponse = {
  items: unknown[];
  total: number;
};
