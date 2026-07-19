import type { PageConfig } from '@/features/shared/types';

export const pageConfig = {
  "id": "runs",
  "label": "Runs",
  "title": "Worker Runs",
  "icon": "ti-rotate-clockwise",
  "slug": "runs",
  "path": "/workers/runs",
  "apiEndpoint": "/api/workers/runs"
} satisfies PageConfig;
