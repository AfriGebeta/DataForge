import { categoryConfig } from './config';
import { pageConfig as AiAnalysisConfig } from './ai-analysis/config';
import { pageConfig as ModelFeedbackConfig } from './model-feedback/config';
import { pageConfig as AnalyticsConfig } from './analytics/config';
import { pageConfig as MapExplorerConfig } from './map-explorer/config';
import type { FeatureNavGroup } from '@/features/shared/types';

const items = [
  AiAnalysisConfig,
  ModelFeedbackConfig,
  AnalyticsConfig,
  MapExplorerConfig,
];

export const navGroup: FeatureNavGroup = {
  ...categoryConfig,
  items,
};
