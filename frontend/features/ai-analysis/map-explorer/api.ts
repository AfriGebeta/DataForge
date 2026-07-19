import type { MapExplorerData } from "./types";

export const API_ENDPOINT = "http://localhost:8080/api/ai/map" as const;

const fakeData: MapExplorerData = {
  overlays: [
    { id: "trust", label: "Trust Heatmap", dot_class: "dd", enabled: true },
    { id: "duplicate", label: "Duplicate Density", dot_class: "dw", enabled: true },
    { id: "boundary", label: "Boundary Validation", dot_class: "db", enabled: false },
  ],
  trust_score_range: 0,
  data_source: "All Verified Sources",
  active_cluster: {
    id: "#8892A",
    lat: "48.8566° N",
    lng: "2.3522° E",
    trust_score: 12.4,
  },
  region_stats: {
    total_points: 1248,
    duplicate_density: 14.2,
  },
};

export async function fetchMapExplorer(): Promise<MapExplorerData> {
  try {
    const res = await fetch(API_ENDPOINT);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to mock data for fetchMapExplorer:", cause);
    return fakeData;
  }
}