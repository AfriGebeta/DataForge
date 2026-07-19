import type { ModelFeedbackData } from "./types";

export const API_ENDPOINT = "http://localhost:8080/api/ai/feedback" as const;

const fakeData: ModelFeedbackData = {
  model_version: "v2.4.1-beta",
  human_corrections: 12408,
  human_corrections_delta: "+8% vs last epoch",
  ai_mistakes: 3192,
  ai_mistakes_delta: "-2.4% false positive rate",
  retrained_samples: 8045,
  retrained_percent: 65,
  review_queue: [
    {
      id: "1",
      geo_id: "GEO-A982-11X",
      type: "MISCLASSIFIED",
      prediction: "Industrial",
      actual: "Residential",
      time_ago: "10m ago",
      icon: "ti-photo",
    },
    {
      id: "2",
      geo_id: "GEO-B441-99Y",
      type: "LOW_CONFIDENCE",
      prediction: "Road (42%)",
      actual: "",
      time_ago: "45m ago",
      icon: "ti-mountain",
    },
    {
      id: "3",
      geo_id: "GEO-C772-22Z",
      type: "MISCLASSIFIED",
      prediction: "Water",
      actual: "Shadow",
      time_ago: "2h ago",
      icon: "ti-photo",
    },
  ],
  total_queue: 3192,
};

export async function fetchModelFeedback(): Promise<ModelFeedbackData> {
  try {
    const res = await fetch(API_ENDPOINT);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to mock data for fetchModelFeedback:", cause);
    return fakeData;
  }
}