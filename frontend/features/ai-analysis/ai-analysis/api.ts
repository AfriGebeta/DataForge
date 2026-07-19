import type { AiAnalysisData } from "./types";

export const API_ENDPOINT = "http://localhost:8080/api/ai/analysis" as const;

const fakeData: AiAnalysisData = {
  metrics: {
    f1_score: 0.942,
    f1_delta: 0.015,
    precision: 0.961,
    recall: 0.924,
    false_positives: 1240,
    false_negatives: 892,
  },
  feature_importance: [
    { name: "Name Similarity (Levenshtein)", score: 0.342, width_percent: 90, color: "#f0ede8" },
    { name: "Coordinate Accuracy (Haversine)", score: 0.285, width_percent: 75 },
    { name: "Category Confidence", score: 0.156, width_percent: 45, color: "#6b7280" },
    { name: "Source Trust Score", score: 0.110, width_percent: 30, color: "#6b7280" },
  ],
  error_hotspots: [
    { region: "India", dot_color: "#3b82f6", failure_type: "Address Parsing", count: 452 },
    { region: "Brazil", dot_color: "#ef4444", failure_type: "Entity Resolution", count: 318 },
    { region: "Indonesia", dot_color: "#8b5cf6", failure_type: "Language Vector", count: 195 },
    { region: "Nigeria", dot_color: "#f59e0b", failure_type: "Coord Offset", count: 124 },
  ],
  retraining: {
    model_version: "v4.2.1-spatial-rc",
    last_trained: "Oct 24, 2023 (14 days ago)",
    dataset_size: "14.2 Billion Nodes",
    dataset_delta: "+1.4B",
    epoch_readiness_percent: 82,
  },
};

export async function fetchAiAnalysis(): Promise<AiAnalysisData> {
  try {
    const res = await fetch(API_ENDPOINT);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to mock data for fetchAiAnalysis:", cause);
    return fakeData;
  }
}