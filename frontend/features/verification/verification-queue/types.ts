/** Domain types for verification-queue — align with backend contracts. */

export type VerificationQueueParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type VerificationQueueResponse = {
  items: unknown[];
  total: number;
};
