import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type {
  CompletenessRule,
  CompletenessRulesParams,
  CompletenessRulesResponse,
  CreateCompletenessRuleRequest,
} from "./types";

/** Real endpoint: PlaceForge's data-quality module. */
export const API_ENDPOINT = `${API_BASE_URL}/api/v1/completeness-rules`;

// Backend shape (data-quality/api/v1/model.CompletenessRuleResponse) — the
// level field is named applies_to_level server-side, and GET returns a bare
// array, not a {data,total} envelope like the other data-quality list
// endpoints (see ListCompletenessRulesHandler).
type BackendRule = {
  id: string;
  place_type: CompletenessRule["place_type"];
  required_field: string;
  weight: number;
  description?: string;
  applies_to_level: CompletenessRule["level"];
};

function fromBackend(r: BackendRule): CompletenessRule {
  return {
    id: r.id,
    place_type: r.place_type,
    required_field: r.required_field,
    weight: r.weight,
    description: r.description ?? "",
    level: r.applies_to_level,
  };
}

export async function fetchCompletenessRules(
  params?: CompletenessRulesParams,
): Promise<CompletenessRulesResponse> {
  const query = new URLSearchParams();
  if (params?.place_type) query.set("place_type", params.place_type);
  if (params?.level) query.set("level", params.level);

  const res = await apiFetch(`${API_ENDPOINT}?${query.toString()}`);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  const rules: BackendRule[] = await res.json();
  const data = rules.map(fromBackend);
  return { data, total: data.length };
}

export async function createCompletenessRule(
  request: CreateCompletenessRuleRequest,
): Promise<CompletenessRule> {
  const res = await apiFetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      place_type: request.place_type,
      required_field: request.required_field,
      weight: request.weight,
      description: request.description || undefined,
      applies_to_level: request.level,
    }),
  });
  if (!res.ok) {
    let msg = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) msg = body.message;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(msg);
  }
  return fromBackend(await res.json());
}

export async function deleteCompletenessRule(id: string): Promise<void> {
  const res = await apiFetch(`${API_ENDPOINT}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
}