import { EXPORT_ENDPOINT } from "../../api";
import type { AuditLogsParams } from "../../types";

export async function exportAuditLogsToCSV(
  onToast: (msg: string) => void,
  params?: AuditLogsParams,
): Promise<void> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.pageSize) searchParams.set("pageSize", params.pageSize.toString());
    if (params?.action_type) searchParams.set("action_type", params.action_type);
    if (params?.actor) searchParams.set("actor", params.actor);

    const res = await fetch(`${EXPORT_ENDPOINT}?${searchParams.toString()}`);
    if (!res.ok) throw new Error("Failed to export logs");

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "audit-logs.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    onToast("Audit logs exported successfully!");
  } catch (error) {
    onToast("Failed to export audit logs.");
    console.error("Export failed:", error);
  }
}