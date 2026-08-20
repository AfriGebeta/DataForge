import { categoryConfig } from './config';
import { pageConfig as AddSourceGuideConfig } from './add-source-guide/config';
import type { FeatureNavGroup } from '@/features/shared/types';

const items = [
  AddSourceGuideConfig,
];

export const navGroup: FeatureNavGroup = {
  ...categoryConfig,
  items,
};
