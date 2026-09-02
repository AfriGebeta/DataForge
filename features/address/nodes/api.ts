import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type { AddressBoundary, AddressLevelDef, AddressNode, BoundingBox } from "./types";

const ADDRESSES_ENDPOINT = `${API_BASE_URL}/api/v1/addresses`;
const ADDRESS_LEVELS_ENDPOINT = `${API_BASE_URL}/api/v1/address-levels`;

type BackendListResponse = {
  data: AddressNode[];
  total: number;
  limit: number;
  offset: number;
};

// No real pagination UI yet - this just asks for everything in one page.
// 300 was enough while the address tree only held subcity.json's 130
// imported admin nodes; it silently truncated once
// scripts/import_dashen_voronoi.py added 445 more (575 total). Bumped with
// headroom rather than wired up to `total` - revisit with real pagination
// if this data keeps growing.
const LIST_LIMIT = "2000";

export async function fetchAddressNodes(
  params: { level?: number; search?: string; bbox?: BoundingBox } = {},
): Promise<AddressNode[]> {
  const query = new URLSearchParams({ limit: LIST_LIMIT });
  if (params.level != null) query.set("level", String(params.level));
  if (params.search) query.set("search", params.search);
  if (params.bbox) {
    query.set("minLat", String(params.bbox.minLat));
    query.set("minLng", String(params.bbox.minLng));
    query.set("maxLat", String(params.bbox.maxLat));
    query.set("maxLng", String(params.bbox.maxLng));
  }

  const res = await apiFetch(`${ADDRESSES_ENDPOINT}?${query.toString()}`);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  const body: BackendListResponse = await res.json();
  return body.data;
}

// POST /addresses/boundaries - batched alternative to N individual
// per-node boundary fetches (what AddressNodesPage used to fire, one per
// visible node, up to 16 at a time). ids with no boundary set are simply
// absent from the response, not an error - same as a single failed fetch,
// this returns an empty map rather than throwing, so one bad batch doesn't
// take down every other chunk's markers.
export async function fetchAddressBoundaries(ids: string[]): Promise<Map<string, GeoJSON.Geometry>> {
  const result = new Map<string, GeoJSON.Geometry>();
  if (ids.length === 0) return result;
  try {
    const res = await apiFetch(`${ADDRESSES_ENDPOINT}/boundaries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) return result;
    const body: { data: AddressBoundary[] } = await res.json();
    for (const item of body.data) {
      if (item.boundary) result.set(item.id, item.boundary);
    }
  } catch (cause) {
    console.warn("fetchAddressBoundaries failed:", cause);
  }
  return result;
}

async function throwOnError(res: Response): Promise<never> {
  let msg = `Request failed with status ${res.status}`;
  try {
    const body = await res.json();
    if (body?.message) msg = body.message;
  } catch {
    // ignore non-JSON error bodies
  }
  throw new Error(msg);
}

export type CreateAddressNodePayload = {
  level: number;
  parentId?: string;
  name: Record<string, string>;
  code?: string;
  boundary?: GeoJSON.Geometry;
};

// POST /addresses - creates a standalone admin-hierarchy node, optionally
// with an initial boundary drawn on the map. Throws on failure so the Add
// Node form can show the real error.
export async function createAddressNode(payload: CreateAddressNodePayload): Promise<AddressNode> {
  const res = await apiFetch(ADDRESSES_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return throwOnError(res);
  return res.json();
}

// PUT /addresses/{id}/boundary - replaces an existing node's boundary
// polygon (e.g. after dragging its vertices on the map). Throws on failure
// so the edit UI can show the real error instead of silently discarding it.
export async function updateAddressBoundary(id: string, boundary: GeoJSON.Geometry): Promise<AddressNode> {
  const res = await apiFetch(`${ADDRESSES_ENDPOINT}/${id}/boundary`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ boundary }),
  });
  if (!res.ok) return throwOnError(res);
  return res.json();
}

// GET /address-levels - every defined level's display metadata (name,
// color), replacing what used to be this file's own hardcoded
// ADDRESS_LEVEL_LABELS/ADDRESS_LEVEL_COLORS consts.
export async function fetchAddressLevels(): Promise<AddressLevelDef[]> {
  const res = await apiFetch(ADDRESS_LEVELS_ENDPOINT);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  const body: { data: AddressLevelDef[] } = await res.json();
  return body.data;
}

// PUT /address-levels/{level} - renames/recolors an existing level, or
// defines a brand new one (level itself is the primary key - any positive
// integer not already in use works). Throws on failure so the management
// form can show the real error.
export async function upsertAddressLevel(
  level: number,
  name: Record<string, string>,
  color: string | null,
): Promise<AddressLevelDef> {
  const res = await apiFetch(`${ADDRESS_LEVELS_ENDPOINT}/${level}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, color }),
  });
  if (!res.ok) return throwOnError(res);
  return res.json();
}
