export type ModelMetrics = {
  f1_score: number;
  f1_delta: number;
  precision: number;
  recall: number;
  false_positives: number;
  false_negatives: number;
};

export type FeatureImportance = {
  name: string;
  score: number;
  width_percent: number;
  color?: string;
};

export type ErrorHotspot = {
  region: string;
  dot_color: string;
  failure_type: string;
  count: number;
};

export type RetrainingStatus = {
  model_version: string;
  last_trained: string;
  dataset_size: string;
  dataset_delta: string;
  epoch_readiness_percent: number;
};

export type AiAnalysisData = {
  metrics: ModelMetrics;
  feature_importance: FeatureImportance[];
  error_hotspots: ErrorHotspot[];
  retraining: RetrainingStatus;
};