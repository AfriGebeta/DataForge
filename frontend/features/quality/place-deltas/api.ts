import type {
  CreatePlaceDeltaRequest,
  PlaceDelta,
  PlaceDeltasParams,
  PlaceDeltasResponse,
} from "./types";

export const API_ENDPOINT = "http://localhost:8080/api/quality/deltas" as const;

const fakeDeltas: PlaceDelta[] = [
  { id: "1", source_place_id: "a1b2…c3d4", action: "UPDATE", field_name: "phone", source_type: "USER_SUBMISSION", after_value: "+251911000002", is_applied: false },
  { id: "2", source_place_id: "e5f6…g7h8", action: "ADD", field_name: "website", source_type: "OSM", after_value: "https://kaldis.com", is_applied: false },
  { id: "3", source_place_id: "i9j0…k1l2", action: "REMOVE", field_name: "fax", source_type: "PARTNER_IMPORT", after_value: "null", is_applied: true },
  { id: "4", source_place_id: "m3n4…o5p6", action: "UPDATE", field_name: "name", source_type: "USER_SUBMISSION", after_value: "Kaldi's Coffee", is_applied: false },
];

export async function fetchPlaceDeltas(params?: PlaceDeltasParams): Promise<PlaceDeltasResponse> {
  try {
    const res = await fetch(API_ENDPOINT);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to mock data for fetchPlaceDeltas:", cause);
    let filtered = [...fakeDeltas];
    if (params?.action) filtered = filtered.filter((d) => d.action === params.action);
    if (params?.source_type) filtered = filtered.filter((d) => d.source_type === params.source_type);
    if (params?.applied === "applied") filtered = filtered.filter((d) => d.is_applied);
    if (params?.applied === "unapplied") filtered = filtered.filter((d) => !d.is_applied);
    return { data: filtered, total: filtered.length };
  }
}

export async function createPlaceDelta(request: CreatePlaceDeltaRequest): Promise<PlaceDelta> {
  try {
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to mock for createPlaceDelta:", cause);
    const newDelta: PlaceDelta = {
      id: `${Date.now()}`,
      source_place_id: request.source_place_id,
      target_place_id: request.target_place_id,
      action: request.action,
      field_name: request.field_name ?? "",
      source_type: "USER_SUBMISSION",
      after_value: request.after_data,
      is_applied: false,
    };
    fakeDeltas.unshift(newDelta);
    return newDelta;
  }
}

export async function applyPlaceDelta(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_ENDPOINT}/${id}/apply`, { method: "POST" });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  } catch (cause) {
    console.warn("Falling back to mock for applyPlaceDelta:", cause);
    const delta = fakeDeltas.find((d) => d.id === id);
    if (delta) delta.is_applied = true;
  }
}

export async function deletePlaceDelta(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_ENDPOINT}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  } catch (cause) {
    console.warn("Falling back to mock for deletePlaceDelta:", cause);
    const index = fakeDeltas.findIndex((d) => d.id === id);
    if (index !== -1) fakeDeltas.splice(index, 1);
  }
}