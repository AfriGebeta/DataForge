import { categoryConfig } from './config';
import { pageConfig as NodesConfig } from './nodes/config';
import { pageConfig as ConflictsConfig } from './conflicts/config';
import type { FeatureNavGroup } from '@/features/shared/types';

const items = [
  NodesConfig,
  ConflictsConfig,
];

export const navGroup: FeatureNavGroup = {
  ...categoryConfig,
  items,
};
