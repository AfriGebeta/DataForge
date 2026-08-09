import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type { AuditLogItem, AuditLogsParams, AuditLogsResponse } from "./types";

/** Real endpoint: PlaceForge's system module. */
export const API_ENDPOINT = `${API_BASE_URL}/api/v1/audit-logs`;

type BackendAuditLog = AuditLogItem; // response fields already match 1:1

export async function fetchAuditLogs(
  params?: AuditLogsParams,
): Promise<AuditLogsResponse> {
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 25;
  const query = new URLSearchParams({
    limit: String(pageSize),
    offset: String((page - 1) * pageSize),
  });
  if (params?.actorId) query.set("actor_id", params.actorId);
  if (params?.entityType) query.set("entity_type", params.entityType);
  if (params?.action) query.set("action", params.action);

  const res = await apiFetch(`${API_ENDPOINT}?${query.toString()}`);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  const body: { data: BackendAuditLog[]; total: number } = await res.json();
  return { data: body.data, total: body.total, page, pageSize };
}