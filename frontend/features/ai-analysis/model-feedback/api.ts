import type { ModelFeedbackParams, ModelFeedbackResponse } from './types';

/** Planned endpoint: /api/ai/feedback */
export const API_ENDPOINT = '/api/ai/feedback' as const;

export async function fetchModelFeedback(
  _params?: ModelFeedbackParams,
): Promise<ModelFeedbackResponse> {
  // TODO: replace with fetch(API_ENDPOINT, ...) when backend is ready
  return { items: [], total: 0 };
}
