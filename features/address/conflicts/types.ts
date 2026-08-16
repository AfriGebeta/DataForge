// Domain types for the Address -> Conflicts page. Mirrors PlaceForge's
// data-quality module (HIERARCHY-category flags) and the
// address-admin-level module's GET /addresses/{id} — duplicated rather
// than imported from features/quality/validation-flags, same convention
// the rest of this codebase already follows for cross-feature types
// (see features/system/settings/types.ts's AdminRole comment).

export type HierarchyConflictFlag = {
  id: string;
  placeId: string;
  message: string;
  isResolved: boolean;
  // The other side of the conflict — an address-hierarchy node id, stored
  // in the flag's fieldName by PlaceForge's
  // src/integrations/geovalidate/hierarchy.go. Null for older/manually
  // created flags that predate this.
  conflictingNodeId: string | null;
};

export type AddressNode = {
  id: string;
  parentId: string | null;
  level: number | null;
  code: string | null;
  name: Record<string, string> | null;
  latitude: number | null;
  longitude: number | null;
  hasBoundary: boolean;
};

export type ConflictPlaceInfo = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  addressId: string | null;
};

// GET /addresses/{id}/boundary — fetched lazily (only when
// AddressNode.hasBoundary is true), separately from the node itself, since
// some of these polygons run into the thousands of points.
export type AddressBoundary = {
  id: string;
  boundary: GeoJSON.Geometry | null;
};

// GET /addresses/boundary-conflicts — two same-level address nodes whose
// boundary polygons meaningfully overlap (e.g. after one gets reshaped via
// the Address map's Edit boundary flow and eats into a neighbor). Computed
// live by PlaceForge straight from PostGIS
// (address-admin-level/repository/main.go's ListBoundaryConflicts) - no
// GeoValidate/AI involved, unlike HierarchyConflictFlag above, and nothing
// to mark resolved: it just stops showing up once the overlap is fixed.
export type BoundaryConflict = {
  nodeAId: string;
  nodeAName: Record<string, string> | null;
  nodeBId: string;
  nodeBName: Record<string, string> | null;
  level: number;
  // Overlap area / smaller polygon's own area (0-1).
  overlapRatio: number;
};
