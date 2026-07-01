import { pageConfig as ValidationFlagsConfig } from './validation-flags/config';
import { pageConfig as PlaceDeltasConfig } from './place-deltas/config';
import { pageConfig as MergeRecordsConfig } from './merge-records/config';
import { pageConfig as CompletenessRulesConfig } from './completeness-rules/config';

export const pageTitles = {
  'flags': ValidationFlagsConfig.title,
  'deltas': PlaceDeltasConfig.title,
  'merges': MergeRecordsConfig.title,
  'rules': CompletenessRulesConfig.title,
} as const;
