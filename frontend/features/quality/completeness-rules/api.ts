import type {
  CompletenessRule,
  CompletenessRulesParams,
  CompletenessRulesResponse,
  CreateCompletenessRuleRequest,
} from "./types";

export const API_ENDPOINT = "http://localhost:8080/api/quality/rules" as const;

const fakeRules: CompletenessRule[] = [
  { id: "1", place_type: "POI", required_field: "name", weight: 1.00, level: "MINIMAL", description: "POIs must have a name" },
  { id: "2", place_type: "POI", required_field: "coordinates", weight: 1.00, level: "MINIMAL", description: "POIs must have coordinates" },
  { id: "3", place_type: "POI", required_field: "phone", weight: 0.15, level: "GOOD", description: "POIs should have a phone" },
  { id: "4", place_type: "POI", required_field: "website", weight: 0.10, level: "COMPLETE", description: "POIs ideally have a website" },
  { id: "5", place_type: "ROAD", required_field: "name", weight: 0.90, level: "MINIMAL", description: "Roads need a name" },
  { id: "6", place_type: "BUILDING", required_field: "address", weight: 0.70, level: "PARTIAL", description: "Buildings should have an address" },
];

export async function fetchCompletenessRules(
  params?: CompletenessRulesParams,
): Promise<CompletenessRulesResponse> {
  try {
    const res = await fetch(API_ENDPOINT);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to mock data for fetchCompletenessRules:", cause);
    let filtered = [...fakeRules];
    if (params?.place_type) filtered = filtered.filter((r) => r.place_type === params.place_type);
    if (params?.level) filtered = filtered.filter((r) => r.level === params.level);
    return { data: filtered, total: filtered.length };
  }
}

export async function createCompletenessRule(
  request: CreateCompletenessRuleRequest,
): Promise<CompletenessRule> {
  try {
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to mock for createCompletenessRule:", cause);
    const newRule: CompletenessRule = {
      id: `${Date.now()}`,
      ...request,
    };
    fakeRules.push(newRule);
    return newRule;
  }
}

export async function deleteCompletenessRule(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_ENDPOINT}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  } catch (cause) {
    console.warn("Falling back to mock for deleteCompletenessRule:", cause);
    const index = fakeRules.findIndex((r) => r.id === id);
    if (index !== -1) fakeRules.splice(index, 1);
  }
}