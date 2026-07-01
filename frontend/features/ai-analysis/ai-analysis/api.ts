import type { AiAnalysisParams, AiAnalysisResponse } from './types';

/** Planned endpoint: /api/ai/analysis */
export const API_ENDPOINT = '/api/ai/analysis' as const;

export async function fetchAiAnalysis(
  _params?: AiAnalysisParams,
): Promise<AiAnalysisResponse> {
  // TODO: replace with fetch(API_ENDPOINT, ...) when backend is ready
  return { items: [], total: 0 };
}
