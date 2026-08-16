export type DecisionCount = {
  decision: string;
  count: number;
};

export type ReasonCount = {
  reason: string;
  count: number;
};

export type ModelPerformanceData = {
  total_places: number;
  validated_count: number;
  coverage_percent: number;
  avg_overall_score: number | null;
  last_validated_at: string | null;
  decision_breakdown: DecisionCount[];
  top_reasons: ReasonCount[];
};
