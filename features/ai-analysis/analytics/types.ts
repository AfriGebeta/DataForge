export type RiskLevel = "HIGH_ALERT" | "ELEVATED" | "STABLE";

export type TrustTrendPoint = {
  day: string;
  avg_score: number;
};

export type RiskSegment = {
  name: string;
  total: number;
  needs_review: number;
  risk_percent: number;
};

export type AnalyticsData = {
  trust_score_trend: TrustTrendPoint[];
  duplicate_detection_rate: number | null;
  reviewer_productivity_7d: number;
  peak_review_hour: number | null;
  risk_segments: RiskSegment[];
};
