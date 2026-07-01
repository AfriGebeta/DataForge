import type { AuditLogsParams, AuditLogsResponse } from './types';

/** Planned endpoint: /api/system/audit-logs */
export const API_ENDPOINT = '/api/system/audit-logs' as const;

export async function fetchAuditLogs(
  _params?: AuditLogsParams,
): Promise<AuditLogsResponse> {
  // TODO: replace with fetch(API_ENDPOINT, ...) when backend is ready
  return { items: [], total: 0 };
}
