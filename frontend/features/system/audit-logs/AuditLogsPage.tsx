"use client";

import HtmlContentPage from "@/features/shared/HtmlContentPage";
import { content } from "./content";
import { pageConfig } from "./config";
import { exportAuditLogsToCSV } from "./export/exportHandler";

export default function AuditLogsPage() {
  // Function to handle export button click
  const handleExportCSV = async () => {
    // Call the export function
    await exportAuditLogsToCSV();
  };

  // Add the export function to the global scope
  (window as any).exportAuditLogsToCSV = handleExportCSV;

  // Update the content to include the export handler
  const updatedContent = content.replace(
    'data-toast="Exporting CSV…"',
    'onclick="exportAuditLogsToCSV()"',
  );

  return <HtmlContentPage content={updatedContent} pageId={pageConfig.id} />;
}
