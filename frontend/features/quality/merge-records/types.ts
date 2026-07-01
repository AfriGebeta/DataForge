/** Domain types for merge-records — align with backend contracts. */

export type MergeRecordsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type MergeRecordsResponse = {
  items: unknown[];
  total: number;
};
