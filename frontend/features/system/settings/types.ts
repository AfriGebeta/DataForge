export type ModelStatus = "ACTIVE" | "AVAILABLE" | "LOCKED";

export type Model = {
  id: string;
  name: string;
  description: string;
  status: ModelStatus;
};

export type ApiIntegration = {
  id: string;
  name: string;
  icon: string;
  status: "connected" | "expired" | "disconnected";
  enabled: boolean;
};

export type AlertPreference = {
  id: string;
  label: string;
  enabled: boolean;
};

export type TrustScoreWeight = {
  label: string;
  percent: number;
};

export type SettingsData = {
  anomaly_sensitivity: number;
  max_threads: number;
  inference_timeout_ms: number;
  models: Model[];
  default_role: string;
  trust_weights: TrustScoreWeight[];
  integrations: ApiIntegration[];
  alert_preferences: AlertPreference[];
};