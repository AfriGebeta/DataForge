import type { PageConfig } from '@/features/shared/types';

export const pageConfig = {
  "id": "instances",
  "label": "Instances",
  "title": "Worker Instances",
  "icon": "ti-server",
  "slug": "instances",
  "apiEndpoint": "/api/workers/instances"
} satisfies PageConfig;
