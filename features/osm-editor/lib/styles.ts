// Visual style tables — map-editor-full-spec.md Part 3. Colors/widths
// are ported as literal data from the spec's tables; classification
// follows §B4's "prioritized primary class, first match wins" model.
// Icon libraries named in the spec (maki/temaki/Font Awesome/roentgen)
// aren't available in this repo (lucide-react is the only icon
// package) — see lib/presets.ts for the lucide-based substitute; this
// file only owns color/width/casing.

import type { OsmTags } from "./graph";

export interface WidthSet {
  casing: [number, number]; // [normal, low-zoom]
  stroke: [number, number];
}

export const WIDTHS = {
  majorRoad: { casing: [10, 7], stroke: [8, 5] } as WidthSet,
  minorRoad: { casing: [7, 5], stroke: [5, 3] } as WidthSet,
  driveway: { casing: [6.25, 4.25], stroke: [4.25, 2.25] } as WidthSet,
  path: { casing: [5, 3], stroke: [3, 1] } as WidthSet,
  railway: { casing: [7, 5], stroke: [2, 2] } as WidthSet,
  waterwayDefault: { casing: [7, 5], stroke: [5, 3] } as WidthSet,
  waterwayWide: { casing: [10, 7], stroke: [8, 5] } as WidthSet,
  aerowayTaxiway: { casing: [7, 5], stroke: [5, 3] } as WidthSet,
  aerowayRunway: { casing: [10, 7], stroke: [2, 2] } as WidthSet,
};

// Invisible hover/selection "shadow" stroke width (§3.1) — 20px for
// wide roads/rivers/runways down to 12px low-zoom, 16px for narrow
// roads/paths/rail/waterways down to 12px low-zoom.
export function shadowWidth(kind: "wide" | "narrow", zoom: number): number {
  const lowZoom = zoom < 17;
  if (kind === "wide") return lowZoom ? 12 : 20;
  return lowZoom ? 12 : 16;
}

export function widthAt(w: WidthSet, zoom: number): { casing: number; stroke: number } {
  const lowZoom = zoom < 17;
  return { casing: lowZoom ? w.casing[1] : w.casing[0], stroke: lowZoom ? w.stroke[1] : w.stroke[0] };
}

export interface RoadStyle {
  stroke: string;
  casing: string;
  widths: WidthSet;
  strokeDash?: string;
  wide?: boolean;
}

const HIGHWAY_STYLE: Record<string, RoadStyle> = {
  motorway: { stroke: "#CF2081", casing: "#70372f", widths: WIDTHS.majorRoad },
  trunk: { stroke: "#DD2F22", casing: "#70372f", widths: WIDTHS.majorRoad },
  primary: { stroke: "#F99806", casing: "#70372f", widths: WIDTHS.majorRoad },
  secondary: { stroke: "#F3F312", casing: "#70372f", widths: WIDTHS.majorRoad },
  tertiary: { stroke: "#FFF9B3", casing: "#70372f", widths: WIDTHS.majorRoad },
  residential: { stroke: "#fff", casing: "#444", widths: WIDTHS.majorRoad },
  unclassified: { stroke: "#dca", casing: "#444", widths: WIDTHS.majorRoad },
  living_street: { stroke: "#ccc", casing: "#fff", widths: WIDTHS.majorRoad },
  pedestrian: { stroke: "#fff", casing: "#988", widths: WIDTHS.majorRoad, strokeDash: "6,6" },
  road: { stroke: "#9e9e9e", casing: "#666", widths: WIDTHS.majorRoad },
  service: { stroke: "#fff", casing: "#666", widths: WIDTHS.minorRoad },
  track: { stroke: "#c5b59f", casing: "#746f6f", widths: WIDTHS.minorRoad },
  bus_guideway: { stroke: "#dca", casing: "#666", widths: WIDTHS.minorRoad },
  path: { stroke: "#988", casing: "#988", widths: WIDTHS.path, strokeDash: "4,4" },
  footway: { stroke: "#988", casing: "#fff", widths: WIDTHS.path },
  cycleway: { stroke: "#58a9ed", casing: "#fff", widths: WIDTHS.path },
  bridleway: { stroke: "#e06d5f", casing: "#fff", widths: WIDTHS.path },
  steps: { stroke: "#81d25c", casing: "#fff", widths: WIDTHS.path },
  ladder: { stroke: "#81d25c", casing: "#fff", widths: WIDTHS.path },
  via_ferrata: { stroke: "#6f1f1f", casing: "#6f1f1f", widths: WIDTHS.path, strokeDash: "0,9" },
  corridor: { stroke: "#fff", casing: "#8cd05f", widths: WIDTHS.path, strokeDash: "6,4" },
};

const SERVICE_SUBTYPE_STYLE: Record<string, Partial<RoadStyle>> = {
  parking_aisle: { stroke: "#cccac7" },
  driveway: { stroke: "#fff6e4", widths: WIDTHS.driveway },
  emergency_access: { stroke: "#ddb2aa" },
};

const LINK_SUFFIX = "_link";

// Roads whose base classification is one of the "major" classes but
// carry a `_link` suffix (motorway_link, trunk_link, ...) share their
// parent class's style per §3.2.
function baseHighwayValue(value: string): string {
  return value.endsWith(LINK_SUFFIX) ? value.slice(0, -LINK_SUFFIX.length) : value;
}

export function classifyRoad(tags: OsmTags): RoadStyle | null {
  const highway = tags.highway;
  if (!highway) return null;

  const base = baseHighwayValue(highway);

  if (base === "footway" && tags.footway === "sidewalk") {
    return { stroke: "#d4b4b4", casing: "#d4b4b4", widths: WIDTHS.path };
  }
  if (base === "path" && tags.bridge) {
    return { stroke: "#dca", casing: "#dca", widths: WIDTHS.path };
  }
  if (base === "service" && tags.service && SERVICE_SUBTYPE_STYLE[tags.service]) {
    return { ...HIGHWAY_STYLE.service, ...SERVICE_SUBTYPE_STYLE[tags.service] };
  }

  const style = HIGHWAY_STYLE[base];
  if (!style) return null;
  return style;
}

export interface LineStyle {
  stroke: string;
  casing: string | null;
  widths: WidthSet;
  strokeDash?: string;
  wide?: boolean;
}

export function classifyRailway(tags: OsmTags): LineStyle | null {
  if (!tags.railway) return null;
  if (tags.railway === "subway") return { stroke: "#bbb", casing: "#222", widths: WIDTHS.railway, strokeDash: "10,8" };
  if (tags.service) return { stroke: "#dca", casing: "#666", widths: WIDTHS.railway };
  const disused = tags.disused === "yes" || tags.railway === "disused";
  return { stroke: "#eee", casing: disused ? "#808080" : "#555", widths: WIDTHS.railway, strokeDash: "10,8" };
}

export function classifyWaterway(tags: OsmTags): LineStyle | null {
  if (!tags.waterway) return null;
  if (tags.waterway === "river") return { stroke: "#7dd", casing: null, widths: WIDTHS.waterwayWide, wide: true };
  if (tags.waterway === "ditch") return { stroke: "#39a", casing: "#444", widths: WIDTHS.waterwayDefault };
  return { stroke: "#7dd", casing: "#444", widths: WIDTHS.waterwayDefault };
}

export function classifyAeroway(tags: OsmTags): LineStyle | null {
  if (!tags.aeroway) return null;
  if (tags.aeroway === "runway") return { stroke: "#fff", casing: "#000", widths: WIDTHS.aerowayRunway, strokeDash: "24,48", wide: true };
  if (tags.aeroway === "taxiway") return { stroke: "#ff0", casing: "#666", widths: WIDTHS.aerowayTaxiway };
  return null;
}

// ── Areas (§3.4) ─────────────────────────────────────────────────────

export interface AreaColor {
  fill: string;
  stroke: string;
}

const GREEN: AreaColor = { fill: "rgba(140,208,95,0.3)", stroke: "rgb(140,208,95)" };
const BLUE: AreaColor = { fill: "rgba(119,211,222,0.3)", stroke: "rgb(119,211,222)" };
const YELLOW: AreaColor = { fill: "rgba(255,255,148,0.3)", stroke: "rgba(255,255,148,0.9)" };
const GOLD: AreaColor = { fill: "rgba(196,189,25,0.3)", stroke: "rgb(196,189,25)" };
const ORANGE: AreaColor = { fill: "rgba(214,136,26,0.3)", stroke: "rgb(214,136,26)" };
const PINK: AreaColor = { fill: "rgba(228,164,245,0.3)", stroke: "rgb(228,164,245)" };
const TEAL: AreaColor = { fill: "rgba(153,225,170,0.3)", stroke: "rgb(153,225,170)" };
const LIGHT_GREEN: AreaColor = { fill: "rgba(191,232,63,0.3)", stroke: "rgb(191,232,63)" };
const TAN: AreaColor = { fill: "rgba(245,220,186,0.3)", stroke: "rgb(245,220,186)" };
const DARK_GRAY: AreaColor = { fill: "rgba(140,140,140,0.5)", stroke: "rgb(170,170,170)" };
const BUILDING_RED: AreaColor = { fill: "rgba(224,110,95,0.3)", stroke: "rgb(224,110,95)" };
const DEFAULT_GRAY: AreaColor = { fill: "rgba(170,170,170,0.3)", stroke: "rgb(170,170,170)" };

const GREEN_VALUES = new Set([
  "forest",
  "wood",
  "grass",
  "village_green",
  "recreation_ground",
  "garden",
  "golf_course",
  "nature_reserve",
  "park",
  "pitch",
  "track",
]);
const YELLOW_LEISURE = new Set(["beach_volleyball", "baseball", "softball", "running_track"]);
const TEAL_WETLAND = new Set(["marsh", "swamp", "bog", "reedbed"]);
const LIGHT_GREEN_LANDUSE = new Set(["farmland", "meadow", "orchard", "vineyard"]);
const DARK_GRAY_NATURAL = new Set(["bare_rock", "cave_entrance", "cliff", "rock", "scree", "stone", "shingle"]);
const DARK_GRAY_MAN_MADE = new Set(["adit", "groyne", "breakwater", "dam", "weir"]);

// Ordered matchers — first hit wins, mirrors §B4's classification model.
export function classifyAreaColor(tags: OsmTags): AreaColor {
  // §3.5: construction status overrides the underlying category's color
  // regardless of what else is tagged (a building under construction
  // still reads as gold, not building-red).
  if (isUnderConstruction(tags)) return GOLD;
  if (tags.building) return BUILDING_RED;
  if (tags.landuse === "residential") return GOLD;
  if (tags.landuse === "retail" || tags.landuse === "commercial" || tags.landuse === "landfill" || tags.landuse === "military")
    return ORANGE;
  if (tags.landuse === "industrial") return PINK;
  if (tags.power === "plant" || tags.power === "substation") return PINK;
  if (LIGHT_GREEN_LANDUSE.has(tags.landuse ?? "") || tags.landuse === "cemetery" || tags.amenity === "grave_yard") return LIGHT_GREEN;
  if (tags.landuse === "farmyard" || tags.leisure === "horse_riding") return TAN;
  if (
    tags.amenity === "parking" ||
    tags.landuse === "railway" ||
    tags.landuse === "quarry" ||
    tags.leisure === "pitch"
  )
    return DARK_GRAY;
  if (DARK_GRAY_NATURAL.has(tags.natural ?? "") || DARK_GRAY_MAN_MADE.has(tags.man_made ?? "")) return DARK_GRAY;
  if (tags.natural === "wetland" || TEAL_WETLAND.has(tags.wetland ?? "")) return TEAL;
  if (tags.amenity === "fountain" || tags.leisure === "swimming_pool" || tags.natural === "bay" || tags.natural === "strait" || tags.natural === "water")
    return BLUE;
  if (
    YELLOW_LEISURE.has(tags.sport ?? "") ||
    tags.natural === "beach" ||
    tags.natural === "sand" ||
    tags.natural === "scrub" ||
    tags.amenity === "childcare" ||
    tags.amenity === "kindergarten" ||
    tags.amenity === "school" ||
    tags.amenity === "college" ||
    tags.amenity === "university" ||
    tags.amenity === "research_institute"
  )
    return YELLOW;
  if (GREEN_VALUES.has(tags.leisure ?? "") || GREEN_VALUES.has(tags.landuse ?? "") || tags.barrier === "hedge") return GREEN;
  if (tags.natural) return GREEN; // generic natural area without a more specific match (§3.4's fallback rule)
  return DEFAULT_GRAY;
}

// ── Primary classification (§B4) — the ~20 "big" keys checked in
// priority order to pick one primary visual class for an entity. ───────

const PRIMARY_KEYS = [
  "building",
  "highway",
  "railway",
  "waterway",
  "aeroway",
  "amenity",
  "shop",
  "leisure",
  "natural",
  "landuse",
  "power",
  "barrier",
  "man_made",
  "tourism",
  "historic",
  "military",
  "boundary",
  "craft",
  "office",
  "sport",
] as const;

export interface PrimaryClass {
  key: string;
  value: string;
}

export function classifyPrimary(tags: OsmTags): PrimaryClass | null {
  for (const key of PRIMARY_KEYS) {
    const value = tags[key];
    if (value) return { key, value };
  }
  return null;
}

// ── Interaction feedback (§3.6) ─────────────────────────────────────

export const HOVER_SELECT_COLOR = "#f6634f";

export const HOVER_OPACITY = { line: 0.4, point: 0.5 };
export const SELECTED_OPACITY = { line: 0.6, point: 0.7 };

// ── Edit-diff coloring (§3.7) ────────────────────────────────────────

export const EDIT_DIFF_COLORS = {
  added: "rgb(133,255,103)",
  retagged: "#fcde5a",
  moved: "rgb(255,126,46)",
};

// ── Lifecycle (§3.5) — thin/gold/dashed treatment for
// proposed/construction/disused, independent of hue. ─────────────────

export function isProposed(tags: OsmTags): boolean {
  return tags.highway === "proposed" || Object.keys(tags).some((k) => k.startsWith("proposed:"));
}

export function isUnderConstruction(tags: OsmTags): boolean {
  return tags.highway === "construction" || !!tags.construction || Object.keys(tags).some((k) => k.startsWith("construction:"));
}
