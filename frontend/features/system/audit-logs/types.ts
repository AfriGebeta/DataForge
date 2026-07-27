export type AuditLogStatus = "Success" | "Failed" | "Review Flagged";
export type ActorType = "human" | "model" | "system" | "bot";

export type AuditLogItem = {
  id: string;
  timestamp: string;
  actor: string;
  actor_type: ActorType;
  actor_initials?: string;
  actor_color?: string;
  actor_icon?: string;
  action_icon: string;
  action_icon_color: string;
  action: string;
  entity_id: string;
  status: AuditLogStatus;
};

export type AuditLogsParams = {
  page?: number;
  pageSize?: number;
  action_type?: string;
  actor?: string;
};

export type AuditLogsResponse = {
  data: AuditLogItem[];
  total: number;
  page: number;
  pageSize: number;
};