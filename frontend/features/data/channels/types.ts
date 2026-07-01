/** Domain types for channels — align with backend contracts. */

export type ChannelsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type ChannelsResponse = {
  items: unknown[];
  total: number;
};
