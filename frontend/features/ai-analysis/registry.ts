import type { ComponentType } from 'react';
import AiAnalysisPage from './ai-analysis';
import ModelFeedbackPage from './model-feedback';
import AnalyticsPage from './analytics';
import MapExplorerPage from './map-explorer';

export const pages = {
  'ai-analysis': AiAnalysisPage,
  'model-feedback': ModelFeedbackPage,
  'analytics': AnalyticsPage,
  'map-explorer': MapExplorerPage,
} satisfies Record<string, ComponentType>;

export type PageId = keyof typeof pages;
