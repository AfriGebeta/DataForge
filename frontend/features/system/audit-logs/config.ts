import type { PageConfig } from '@/features/shared/types';

export const pageConfig = {
  "id": "audit-logs",
  "label": "Audit Logs",
  "title": "Audit Logs",
  "icon": "ti-history",
  "slug": "audit-logs",
  "path": "/system/audit-logs",
  "apiEndpoint": "/api/system/audit-logs"
} satisfies PageConfig;
