/** Domain types for audit-logs — align with backend contracts. */

export type AuditLogsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type AuditLogItem = {
  timestamp: string;
  actor: string;
  action: string;
  entityId: string;
  status: string;
};

export type AuditLogsResponse = {
  items: AuditLogItem[];
  total: number;
};
