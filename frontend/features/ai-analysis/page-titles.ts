import { pageConfig as AiAnalysisConfig } from './ai-analysis/config';
import { pageConfig as ModelFeedbackConfig } from './model-feedback/config';
import { pageConfig as AnalyticsConfig } from './analytics/config';
import { pageConfig as MapExplorerConfig } from './map-explorer/config';
export const pageTitles = {
  [AiAnalysisConfig.path]: AiAnalysisConfig.title,
  [ModelFeedbackConfig.path]: ModelFeedbackConfig.title,
  [AnalyticsConfig.path]: AnalyticsConfig.title,
  [MapExplorerConfig.path]: MapExplorerConfig.title,
} as const;
