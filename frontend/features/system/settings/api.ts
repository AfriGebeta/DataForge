import type { SettingsData } from "./types";

export const API_ENDPOINT = "http://localhost:8080/api/system/settings" as const;

const fakeSettings: SettingsData = {
  anomaly_sensitivity: 0.85,
  max_threads: 16,
  inference_timeout_ms: 2500,
  models: [
    { id: "1", name: "Gebeta Vision v4", description: "Primary production model. Satellite imagery analysis.", status: "ACTIVE" },
    { id: "2", name: "GeoBERT Fast", description: "Lower latency, reduced resolution. Rapid triage.", status: "AVAILABLE" },
    { id: "3", name: "Custom Hybrid", description: "Requires enterprise license and dedicated compute.", status: "LOCKED" },
  ],
  default_role: "Analyst (Read-only + Annotate)",
  trust_weights: [
    { label: "Source Credibility", percent: 40 },
    { label: "Historical Accuracy", percent: 35 },
    { label: "Human Verification", percent: 25 },
  ],
  integrations: [
    { id: "1", name: "OpenStreetMap Sync", icon: "ti-map", status: "connected", enabled: true },
    { id: "2", name: "Maxar Imagery", icon: "ti-satellite", status: "expired", enabled: false },
  ],
  alert_preferences: [
    { id: "1", label: "Critical Anomaly Detected (Score > 0.9)", enabled: true },
    { id: "2", label: "API Sync Failures", enabled: true },
    { id: "3", label: "Weekly Metric Summary Digest", enabled: false },
  ],
};

export async function fetchSettings(): Promise<SettingsData> {
  try {
    const res = await fetch(API_ENDPOINT);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to mock data for fetchSettings:", cause);
    return fakeSettings;
  }
}

export async function saveSettings(data: SettingsData): Promise<void> {
  try {
    const res = await fetch(API_ENDPOINT, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  } catch (cause) {
    console.warn("Falling back to mock for saveSettings:", cause);
  }
}