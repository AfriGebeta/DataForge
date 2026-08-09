import { fetchAuditLogs } from "../../api";
import type { AuditLogsParams } from "../../types";
import { downloadCSV, logsToCSV } from "./csvUtils";

export async function exportAuditLogsToCSV(
  onToast: (msg: string) => void,
  params?: AuditLogsParams,
): Promise<void> {
  try {
    const response = await fetchAuditLogs(params);
    const csvData = logsToCSV(response.data);
    downloadCSV(csvData, "audit-logs.csv");
    onToast("Audit logs exported successfully!");
  } catch (error) {
    onToast("Failed to export audit logs.");
    console.error("Export failed:", error);
  }
}