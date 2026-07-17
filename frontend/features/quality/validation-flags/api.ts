import type {
  BulkResolveRequest,
  CreateFlagRequest,
  ValidationFlag,
  ValidationFlagsParams,
  ValidationFlagsResponse,
} from "./types";

export const API_ENDPOINT = "http://localhost:8080/api/quality/flags" as const;

const fakeFlags: ValidationFlag[] = [
  { id: "1", place_id: "a1b2…", category: "GEOMETRY", severity: "CRITICAL", flag_code: "COORD_OUT_OF_COUNTRY", message: "Coordinates outside country boundary", is_resolved: false },
  { id: "2", place_id: "c3d4…", category: "ADDRESS", severity: "ERROR", flag_code: "MISSING_STREET", message: "Street name is missing", is_resolved: false },
  { id: "3", place_id: "e5f6…", category: "CONTACT", severity: "WARNING", flag_code: "PHONE_FORMAT", message: "Phone number not in E.164 format", is_resolved: false },
  { id: "4", place_id: "g7h8…", category: "FRESHNESS", severity: "INFO", flag_code: "STALE_HOURS", message: "Last verified over 72h ago", is_resolved: false },
];

export async function fetchValidationFlags(params?: ValidationFlagsParams): Promise<ValidationFlagsResponse> {
  try {
    const res = await fetch(API_ENDPOINT);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to mock data for fetchValidationFlags:", cause);
    let filtered = [...fakeFlags];
    if (params?.category) filtered = filtered.filter((f) => f.category === params.category);
    if (params?.severity) filtered = filtered.filter((f) => f.severity === params.severity);
    if (params?.status === "resolved") filtered = filtered.filter((f) => f.is_resolved);
    if (params?.status === "unresolved") filtered = filtered.filter((f) => !f.is_resolved);
    return {
      data: filtered,
      stats: { critical: 38, error: 71, warning: 33, info: 19 },
      total: filtered.length,
    };
  }
}

export async function createValidationFlag(request: CreateFlagRequest): Promise<ValidationFlag> {
  try {
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch (cause) {
    console.warn("Falling back to mock for createValidationFlag:", cause);
    const newFlag: ValidationFlag = { id: `${Date.now()}`, ...request, is_resolved: false };
    fakeFlags.push(newFlag);
    return newFlag;
  }
}

export async function resolveFlag(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_ENDPOINT}/${id}/resolve`, { method: "POST" });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  } catch (cause) {
    console.warn("Falling back to mock for resolveFlag:", cause);
    const flag = fakeFlags.find((f) => f.id === id);
    if (flag) flag.is_resolved = true;
  }
}

export async function deleteFlag(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_ENDPOINT}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  } catch (cause) {
    console.warn("Falling back to mock for deleteFlag:", cause);
    const index = fakeFlags.findIndex((f) => f.id === id);
    if (index !== -1) fakeFlags.splice(index, 1);
  }
}

export async function bulkResolveFlags(request: BulkResolveRequest): Promise<void> {
  try {
    const res = await fetch(`${API_ENDPOINT}/bulk-resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  } catch (cause) {
    console.warn("Falling back to mock for bulkResolveFlags:", cause);
    fakeFlags
      .filter((f) => f.place_id === request.place_id && !f.is_resolved)
      .forEach((f) => { f.is_resolved = true; });
  }
}