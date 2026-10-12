import { categoryConfig } from './config';
import { pageConfig as GeocodingSyncConfig } from './geocoding-sync/config';
import type { FeatureNavGroup } from '@/features/shared/types';

const items = [
  GeocodingSyncConfig,
];

export const navGroup: FeatureNavGroup = {
  ...categoryConfig,
  items,
};
