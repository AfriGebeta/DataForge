import type { PageConfig } from '@/features/shared/types';

export const pageConfig = {
  "id": "dlq",
  "label": "Dead Letters",
  "title": "Dead Letters",
  "icon": "ti-alert-triangle",
  "slug": "dead-letters",
  "apiEndpoint": "/api/data/dead-letters"
} satisfies PageConfig;
