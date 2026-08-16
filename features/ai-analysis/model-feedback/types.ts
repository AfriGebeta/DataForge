export type AIDecision = "VALID" | "INVALID" | "AMBIGUOUS" | "DUPLICATE";

export type ReviewQueueItem = {
  place_id: number;
  name: string | null;
  place_type: string;
  ai_decision: AIDecision | null;
  ai_overall_score: number | null;
  ai_reasons: string[] | null;
  ai_validated_at: string | null;
};

export type ModelFeedbackData = {
  review_queue: ReviewQueueItem[];
  total_queue: number;
  human_corrections: number;
  ai_mistakes: number;
};
