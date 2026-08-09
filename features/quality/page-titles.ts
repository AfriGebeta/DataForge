import { pageConfig as ValidationFlagsConfig } from './validation-flags/config';
import { pageConfig as PlaceDeltasConfig } from './place-deltas/config';
import { pageConfig as MergeRecordsConfig } from './merge-records/config';
import { pageConfig as CompletenessRulesConfig } from './completeness-rules/config';
export const pageTitles = {
  [ValidationFlagsConfig.path]: ValidationFlagsConfig.title,
  [PlaceDeltasConfig.path]: PlaceDeltasConfig.title,
  [MergeRecordsConfig.path]: MergeRecordsConfig.title,
  [CompletenessRulesConfig.path]: CompletenessRulesConfig.title,
} as const;
