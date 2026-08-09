import type { AuditLogItem } from "../../types";

export function logsToCSV(logs: AuditLogItem[]): string {
  const headers = ["Timestamp (UTC)", "Actor", "Action", "Entity", "Status", "Detail"];
  const rows = logs.map((log) =>
    [
      log.createdAt,
      log.actorLabel,
      log.action,
      [log.entityType, log.entityId].filter(Boolean).join(":"),
      log.status,
      log.detail ?? "",
    ].join(","),
  );
  return [headers.join(","), ...rows].join("\n");
}

export function downloadCSV(
  data: string,
  filename: string = "audit-logs.csv",
): void {
  const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}