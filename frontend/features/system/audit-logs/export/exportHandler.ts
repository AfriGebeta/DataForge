import { fetchAuditLogs } from '../api';
import { downloadCSV } from './csvUtils';

/**
 * Handles the export of audit logs to CSV
 * @param params - Optional parameters for filtering logs
 */
export async function exportAuditLogsToCSV(params?: any): Promise<void> {
  try {
    // Fetch audit logs
    const response = await fetchAuditLogs(params);

    // Convert logs to CSV
    const csvData = logsToCSV(response.items);

    // Download the CSV file
    downloadCSV(csvData, 'audit-logs.csv');

    // Show success toast
    showToast('Audit logs exported successfully!');
  } catch (error) {
    // Show error toast
    showToast('Failed to export audit logs. Please try again.');
    console.error('Export failed:', error);
  }
}

// Helper function to show toast messages
function showToast(message: string): void {
  // Create a toast element
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.opacity = '1';
  toast.style.transition = 'opacity 0.3s';

  // Add content to toast
  toast.innerHTML = `<i class="ti ti-check" style="color: var(--text-success)"></i><span>${message}</span>`;

  // Add toast to document
  document.body.appendChild(toast);

  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// Helper function to convert logs to CSV
function logsToCSV(logs: any[]): string {
  // Define CSV headers
  const headers = ['Timestamp (UTC)', 'Actor', 'Action', 'Entity ID', 'Status'];

  // Create CSV rows
  const rows = logs.map(log => {
    // Format timestamp
    const timestamp = log.timestamp || '';

    // Format actor
    const actor = log.actor || '';

    // Format action
    const action = log.action || '';

    // Format entity ID
    const entityId = log.entityId || '';

    // Format status
    const status = log.status || '';

    // Return CSV row
    return `${timestamp},${actor},${action},${entityId},${status}`;
  });

  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n');
}
