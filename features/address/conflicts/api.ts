import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type { AddressBoundary, AddressNode, BoundaryConflict, ConflictPlaceInfo, HierarchyConflictFlag } from "./types";

const FLAGS_ENDPOINT = `${API_BASE_URL}/api/v1/flags`;
const PLACES_ENDPOINT = `${API_BASE_URL}/api/v1/places`;
const ADDRESSES_ENDPOINT = `${API_BASE_URL}/api/v1/addresses`;

// Backend shape (data-quality/api/v1 ValidationFlagResponse) - fieldName
// is admin-only and not surfaced by features/quality/validation-flags'
// own api.ts, but it's exactly the conflicting node id
// src/integrations/geovalidate/hierarchy.go stores there, so this feature
// reads it directly from the same /flags endpoint instead.
type BackendFlag = {
  id: string;
  place_id: number;
  message: string;
  is_resolved: boolean;
  field_name?: string | null;
};

export async function fetchHierarchyConflicts(): Promise<HierarchyConflictFlag[]> {
  const query = new URLSearchParams({ category: "HIERARCHY", is_resolved: "false", limit: "100" });
  const res = await apiFetch(`${FLAGS_ENDPOINT}?${query.toString()}`);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  const body: { data: BackendFlag[] } = await res.json();
  return body.data.map((f) => ({
    id: f.id,
    placeId: String(f.place_id),
    message: f.message,
    isResolved: f.is_resolved,
    conflictingNodeId: f.field_name ?? null,
  }));
}

type BackendPlace = {
  id: number;
  latitude: number;
  longitude: number;
  names?: { name: string; isPrimary: boolean }[];
  address?: { id: string };
};

export async function fetchConflictPlace(placeId: string): Promise<ConflictPlaceInfo | null> {
  try {
    const res = await apiFetch(`${PLACES_ENDPOINT}/${placeId}`);
    if (!res.ok) return null;
    const body: BackendPlace = await res.json();
    const primary = body.names?.find((n) => n.isPrimary) ?? body.names?.[0];
    return {
      id: body.id,
      name: primary?.name ?? `Place #${placeId}`,
      latitude: body.latitude,
      longitude: body.longitude,
      addressId: body.address?.id ?? null,
    };
  } catch (cause) {
    console.warn("fetchConflictPlace failed:", cause);
    return null;
  }
}

export async function fetchAddressNode(id: string): Promise<AddressNode | null> {
  try {
    const res = await apiFetch(`${ADDRESSES_ENDPOINT}/${id}`);
    if (!res.ok) return null;
    return res.json();
  } catch (cause) {
    console.warn("fetchAddressNode failed:", cause);
    return null;
  }
}

export async function fetchAddressBoundary(id: string): Promise<AddressBoundary | null> {
  try {
    const res = await apiFetch(`${ADDRESSES_ENDPOINT}/${id}/boundary`);
    if (!res.ok) return null;
    return res.json();
  } catch (cause) {
    console.warn("fetchAddressBoundary failed:", cause);
    return null;
  }
}

// GET /addresses/boundary-conflicts - same-level address nodes whose
// boundary polygons meaningfully overlap, computed live from PostGIS (see
// PlaceForge's address-admin-level/repository/main.go's
// ListBoundaryConflicts). No level filter here - the page shows every
// level at once, same as fetchHierarchyConflicts.
export async function fetchBoundaryConflicts(): Promise<BoundaryConflict[]> {
  const res = await apiFetch(`${ADDRESSES_ENDPOINT}/boundary-conflicts`);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  const body: { data: BoundaryConflict[] } = await res.json();
  return body.data;
}

// PUT /addresses/{id}/boundary - lets the Boundary Overlaps section fix a
// conflict in place (drag vertices on ConflictMap, Save) instead of
// forcing a trip to the Address map for the same action. Duplicated from
// features/address/nodes/api.ts's own updateAddressBoundary, same
// cross-feature convention as everything else in this file. Throws on
// failure so the Save button can show the real error.
export async function updateAddressBoundary(id: string, boundary: GeoJSON.Geometry): Promise<AddressNode> {
  const res = await apiFetch(`${ADDRESSES_ENDPOINT}/${id}/boundary`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ boundary }),
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
  return res.json();
}
