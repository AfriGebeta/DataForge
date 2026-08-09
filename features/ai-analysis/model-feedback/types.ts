export type FeedbackItemType = "MISCLASSIFIED" | "LOW_CONFIDENCE" | "CORRECT";

export type FeedbackItem = {
  id: string;
  geo_id: string;
  type: FeedbackItemType;
  prediction: string;
  actual: string;
  time_ago: string;
  icon: string;
};

export type ModelFeedbackData = {
  model_version: string;
  human_corrections: number;
  human_corrections_delta: string;
  ai_mistakes: number;
  ai_mistakes_delta: string;
  retrained_samples: number;
  retrained_percent: number;
  review_queue: FeedbackItem[];
  total_queue: number;
};