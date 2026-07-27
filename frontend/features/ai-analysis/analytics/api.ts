import type { AnalyticsData } from "./types";

export const API_ENDPOINT = "http://localhost:8080/api/ai/analytics" as const;

export const fakeData: AnalyticsData = {
  trust_score_trend: [
    { height_percent: 55, is_accent: false },
    { height_percent: 60, is_accent: false },
    { height_percent: 58, is_accent: false },
    { height_percent: 62, is_accent: false },
    { height_percent: 65, is_accent: false },
    { height_percent: 72, is_accent: true },
    { height_percent: 80, is_accent: true },
  ],
  trust_score_delta: "+2.4%",
  duplicate_detection_rate: 1248,
  duplicate_detection_delta: "12%",
  reviewer_productivity: 84.2,
  peak_hours: "09:00 - 14:00 UTC",
  risk_zones: [
    { name: "Southeast Asia Hub", level: "HIGH_ALERT", width_percent: 100 },
    { name: "Eastern Europe Sector", level: "HIGH_ALERT", width_percent: 90 },
    { name: "LatAm Node Alpha", level: "ELEVATED", width_percent: 60 },
    { name: "North America West", level: "STABLE", width_percent: 30 },
    { name: "Western Europe Core", level: "STABLE", width_percent: 25 },
  ],
};

export async function fetchAnalytics(): Promise<AnalyticsData> {
  try {
    const res = await fetch(API_ENDPOINT);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to mock data for fetchAnalytics:", cause);
    return fakeData;
  }
}