import type { ComponentType } from 'react';
import ValidationFlagsPage from './validation-flags';
import PlaceDeltasPage from './place-deltas';
import MergeRecordsPage from './merge-records';
import CompletenessRulesPage from './completeness-rules';

export const pages = {
  'flags': ValidationFlagsPage,
  'deltas': PlaceDeltasPage,
  'merges': MergeRecordsPage,
  'rules': CompletenessRulesPage,
} satisfies Record<string, ComponentType>;

export type PageId = keyof typeof pages;
