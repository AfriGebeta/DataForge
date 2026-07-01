/** Domain types for audit-logs — align with backend contracts. */

export type AuditLogsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type AuditLogsResponse = {
  items: unknown[];
  total: number;
};
