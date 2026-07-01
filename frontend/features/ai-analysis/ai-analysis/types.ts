/** Domain types for ai-analysis — align with backend contracts. */

export type AiAnalysisParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type AiAnalysisResponse = {
  items: unknown[];
  total: number;
};
