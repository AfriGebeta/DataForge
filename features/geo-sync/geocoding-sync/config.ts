import type { PageConfig } from '@/features/shared/types';

export const pageConfig = {
  id: "geocoding-sync",
  label: "Geocoding Sync",
  title: "Geocoding Sync",
  icon: "ti-refresh",
  slug: "geocoding-sync",
  path: "/geo-sync",
  apiEndpoint: "/api/v1/geo-sync/field-config",
} satisfies PageConfig;
