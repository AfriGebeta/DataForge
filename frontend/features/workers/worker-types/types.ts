/** Domain types for worker-types — align with backend contracts. */

export type WorkerTypesParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type WorkerTypesResponse = {
  items: unknown[];
  total: number;
};
