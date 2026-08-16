import type { PageConfig } from '@/features/shared/types';

export const pageConfig = {
  "id": "nodes",
  "label": "Address",
  "title": "Address Hierarchy",
  "icon": "ti-list-tree",
  "slug": "nodes",
  "path": "/address/nodes",
  "apiEndpoint": "/api/v1/addresses"
} satisfies PageConfig;
