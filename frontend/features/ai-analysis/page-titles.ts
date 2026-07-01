import { pageConfig as AiAnalysisConfig } from './ai-analysis/config';
import { pageConfig as ModelFeedbackConfig } from './model-feedback/config';
import { pageConfig as AnalyticsConfig } from './analytics/config';
import { pageConfig as MapExplorerConfig } from './map-explorer/config';

export const pageTitles = {
  'ai-analysis': AiAnalysisConfig.title,
  'model-feedback': ModelFeedbackConfig.title,
  'analytics': AnalyticsConfig.title,
  'map-explorer': MapExplorerConfig.title,
} as const;
