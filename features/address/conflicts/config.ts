import type { PageConfig } from '@/features/shared/types';

export const pageConfig = {
  "id": "conflicts",
  "label": "Conflicts",
  "title": "Hierarchy Conflicts",
  "icon": "ti-map-pin-exclamation",
  "slug": "conflicts",
  "path": "/address/conflicts",
  "apiEndpoint": "/api/v1/flags"
} satisfies PageConfig;
