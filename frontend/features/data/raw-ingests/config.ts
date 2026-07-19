import type { PageConfig } from '@/features/shared/types';

export const pageConfig = {
  "id": "ingests",
  "label": "Raw Ingests",
  "title": "Raw Ingests",
  "icon": "ti-inbox",
  "slug": "raw-ingests",
  "path": "/data/ingests",
  "apiEndpoint": "/api/data/ingests"
} satisfies PageConfig;
