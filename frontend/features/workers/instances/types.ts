/** Domain types for instances — align with backend contracts. */

export type InstancesParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type InstancesResponse = {
  items: unknown[];
  total: number;
};
