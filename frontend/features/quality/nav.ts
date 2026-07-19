import { categoryConfig } from './config';
import { pageConfig as ValidationFlagsConfig } from './validation-flags/config';
import { pageConfig as PlaceDeltasConfig } from './place-deltas/config';
import { pageConfig as MergeRecordsConfig } from './merge-records/config';
import { pageConfig as CompletenessRulesConfig } from './completeness-rules/config';
import type { FeatureNavGroup } from '@/features/shared/types';

const items = [
  ValidationFlagsConfig,
  PlaceDeltasConfig,
  MergeRecordsConfig,
  CompletenessRulesConfig,
];

export const navGroup: FeatureNavGroup = {
  ...categoryConfig,
  items,
};
