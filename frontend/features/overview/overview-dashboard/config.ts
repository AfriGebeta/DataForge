import type { PageConfig } from '@/features/shared/types';

export const pageConfig = {
  "id": "overview",
  "label": "Overview Dashboard",
  "title": "System Overview",
  "icon": "ti-layout-dashboard",
  "slug": "overview-dashboard",
  "path": "/overview",
  "apiEndpoint": "/api/overview/dashboard"
} satisfies PageConfig;
