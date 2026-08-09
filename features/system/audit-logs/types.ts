// Backed by PlaceForge's real GET /audit-logs (system module). actorType is
// "admin" only where a caller-supplied identity actually exists (login,
// reviewedBy/resolvedBy-style fields already threaded through other
// modules) — every write PlaceForge can't attribute to a real caller
// (no session/auth middleware runs on these routes yet) is honestly
// recorded as "system" rather than inventing a fake human actor.
export type ActorType = "admin" | "system";
export type AuditStatus = "SUCCESS" | "FAILURE";

export type AuditLogItem = {
  id: string;
  createdAt: string;
  actorType: ActorType;
  actorId: string | null;
  actorLabel: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  status: AuditStatus;
  detail: string | null;
};

export type AuditLogsParams = {
  page?: number;
  pageSize?: number;
  actorId?: string;
  entityType?: string;
  action?: string;
};

export type AuditLogsResponse = {
  data: AuditLogItem[];
  total: number;
  page: number;
  pageSize: number;
};