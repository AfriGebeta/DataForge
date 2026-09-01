import { categoryConfig } from './config';
import { pageConfig as NodesConfig } from './nodes/config';
import { pageConfig as ConflictsConfig } from './conflicts/config';
import { pageConfig as InformalAreasConfig } from './informal-areas/config';
import type { FeatureNavGroup } from '@/features/shared/types';

const items = [
  NodesConfig,
  ConflictsConfig,
  InformalAreasConfig,
];

export const navGroup: FeatureNavGroup = {
  ...categoryConfig,
  items,
};
