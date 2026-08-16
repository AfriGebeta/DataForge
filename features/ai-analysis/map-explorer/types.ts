export type AIDecision = "VALID" | "INVALID" | "AMBIGUOUS" | "DUPLICATE";

export type MapPoint = {
  place_id: number;
  name: string | null;
  lat: number;
  lng: number;
  ai_overall_score: number | null;
  ai_decision: AIDecision | null;
  review_status: string;
};

export type MapExplorerData = {
  points: MapPoint[];
  total_points: number;
  duplicate_density_percent: number;
  needs_review_count: number;
  data_source: string;
};
