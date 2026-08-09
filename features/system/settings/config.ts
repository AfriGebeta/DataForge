import type { PageConfig } from '@/features/shared/types';

export const pageConfig = {
  "id": "settings",
  "label": "Settings",
  "title": "Platform Settings",
  "icon": "ti-settings",
  "slug": "settings",
  "path": "/system/settings",
  "apiEndpoint": "/api/system/settings"
} satisfies PageConfig;
