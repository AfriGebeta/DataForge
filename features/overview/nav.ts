import { categoryConfig } from './config';
import { pageConfig as OverviewDashboardConfig } from './overview-dashboard/config';
import type { FeatureNavGroup } from '@/features/shared/types';

const items = [
  OverviewDashboardConfig,
];

export const navGroup: FeatureNavGroup = {
  ...categoryConfig,
  items,
};
