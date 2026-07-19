import { AuditLogItem } from '../types';

/**
 * Converts audit log items to CSV format
 * @param logs - Array of audit log items
 * @returns CSV string
 */
export function logsToCSV(logs: AuditLogItem[]): string {
  // Define CSV headers
  const headers = ['Timestamp (UTC)', 'Actor', 'Action', 'Entity ID', 'Status'];

  // Create CSV rows
  const rows = logs.map(log => {
    // Format timestamp
    const timestamp = log.timestamp;

    // Format actor
    const actor = log.actor;

    // Format action
    const action = log.action;

    // Format entity ID
    const entityId = log.entityId;

    // Format status
    const status = log.status;

    // Return CSV row
    return `${timestamp},${actor},${action},${entityId},${status}`;
  });

  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Downloads CSV data as a file
 * @param data - CSV string data
 * @param filename - Name of the file to download
 */
export function downloadCSV(data: string, filename: string = 'audit-logs.csv'): void {
  // Create a blob from the data
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });

  // Create a link element
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;

  // Trigger the download
  link.click();

  // Clean up
  URL.revokeObjectURL(link.href);
}
