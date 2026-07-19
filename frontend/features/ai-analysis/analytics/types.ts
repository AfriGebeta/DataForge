export type RiskLevel = "HIGH_ALERT" | "ELEVATED" | "STABLE";

export type RiskZone = {
  name: string;
  level: RiskLevel;
  width_percent: number;
};

export type TrustScoreBar = {
  height_percent: number;
  is_accent: boolean;
};

export type AnalyticsData = {
  trust_score_trend: TrustScoreBar[];
  trust_score_delta: string;
  duplicate_detection_rate: number;
  duplicate_detection_delta: string;
  reviewer_productivity: number;
  peak_hours: string;
  risk_zones: RiskZone[];
};