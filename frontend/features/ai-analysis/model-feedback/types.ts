/** Domain types for model-feedback — align with backend contracts. */

export type ModelFeedbackParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type ModelFeedbackResponse = {
  items: unknown[];
  total: number;
};
