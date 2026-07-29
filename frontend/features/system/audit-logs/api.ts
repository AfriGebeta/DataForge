import type { AuditLogItem, AuditLogsParams, AuditLogsResponse } from "./types";

export const API_ENDPOINT = "http://localhost:8080/api/v1/audit/logs" as const;
export const EXPORT_ENDPOINT = "http://localhost:8080/api/v1/audit/logs/export" as const;

const fakeLogs: AuditLogItem[] = [
  {
    id: "1",
    timestamp: "2023-10-25 14:32:01.442",
    actor: "A. Smith (Analyst)",
    actor_type: "human",
    actor_initials: "AS",
    actor_color: "var(--fill-accent)",
    action_icon: "ti-git-merge",
    action_icon_color: "var(--text-accent)",
    action: "Merged Duplicates",
    entity_id: "POI-8492-X, POI-8493-Y",
    status: "Success",
  },
  {
    id: "2",
    timestamp: "2023-10-25 14:30:12.105",
    actor: "Model_GeoVal_v4.2",
    actor_type: "model",
    actor_icon: "ti-map-pin",
    action_icon: "ti-refresh",
    action_icon_color: "var(--text-accent)",
    action: "Rescored Record",
    entity_id: "LOC-1029-A",
    status: "Success",
  },
  {
    id: "3",
    timestamp: "2023-10-25 14:28:55.992",
    actor: "System (API Sync)",
    actor_type: "system",
    actor_icon: "ti-server",
    action_icon: "ti-map-pin",
    action_icon_color: "var(--text-accent)",
    action: "Coordinates Updated",
    entity_id: "BATCH-774-K",
    status: "Review Flagged",
  },
  {
    id: "4",
    timestamp: "2023-10-25 14:15:00.003",
    actor: "OSM Ingestion Bot",
    actor_type: "bot",
    actor_icon: "ti-cloud",
    action_icon: "ti-database",
    action_icon_color: "var(--text-danger)",
    action: "Schema Validation Failed",
    entity_id: "FILE-OSM-ETH-23",
    status: "Failed",
  },
  {
    id: "5",
    timestamp: "2023-10-25 13:50:22.118",
    actor: "J. Doe (Admin)",
    actor_type: "human",
    actor_initials: "JD",
    actor_color: "#3b82f6",
    action_icon: "ti-link",
    action_icon_color: "var(--text-accent)",
    action: "Modified Attributes",
    entity_id: "POI-9921-Z",
    status: "Success",
  },
];

export async function fetchAuditLogs(
  params?: AuditLogsParams,
): Promise<AuditLogsResponse> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    else searchParams.set("page", "1");
    if (params?.pageSize) searchParams.set("pageSize", params.pageSize.toString());
    else searchParams.set("pageSize", "25");
    if (params?.action_type) searchParams.set("action_type", params.action_type);
    if (params?.actor) searchParams.set("actor", params.actor);

    const res = await fetch(`${API_ENDPOINT}?${searchParams.toString()}`);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to mock data for fetchAuditLogs:", cause);
    return { data: fakeLogs, total: 97214, page: 1, pageSize: 25 };
  }
}