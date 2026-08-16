// Domain types for the Address -> Address page (browse the bulk-imported
// admin-area tree - see PlaceForge/scripts/import_admin_boundaries.py and,
// for level 6, PlaceForge/scripts/import_dashen_voronoi.py). Duplicated from
// features/address/conflicts/types.ts rather than shared, same convention
// the rest of this codebase already follows for cross-feature types (see
// features/system/settings/types.ts's AdminRole comment).

// GET /address-levels - display metadata (name/color) for one Address.level
// number. Used to be a hardcoded ADDRESS_LEVEL_LABELS/ADDRESS_LEVEL_COLORS
// object in this file; now backed by PlaceForge's address_level table
// (address-admin-level module) so a level can be renamed/recolored, or a
// brand new one defined (e.g. for a future import with its own level
// number), via PUT /address-levels/{level} without a frontend code change.
export type AddressLevelDef = {
  level: number;
  name: Record<string, string>;
  color: string | null;
};

// Shown for a level with no AddressLevelDef row yet (a level number that
// exists on some address but was never named) or no color set.
export const ADDRESS_LEVEL_FALLBACK_COLOR = "#94a3b8";

export function addressLevelName(def: AddressLevelDef | undefined, level: number): string {
  if (!def) return `Level ${level}`;
  return def.name.en ?? Object.values(def.name)[0] ?? `Level ${level}`;
}

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

// GET /addresses/{id}/boundary — fetched lazily per selected node, since
// some of these polygons run into the thousands of points.
export type AddressBoundary = {
  id: string;
  boundary: GeoJSON.Geometry | null;
};

export function addressNodeName(node: AddressNode): string {
  return node.name?.en ?? Object.values(node.name ?? {})[0] ?? "(unnamed)";
}
