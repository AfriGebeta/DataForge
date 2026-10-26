// Map Data feature filters — iD's "Map Data" pane: hide whole classes of
// features (e.g. buildings) to see what's under them. The graph is never
// touched; this only decides what the map *renders*. Anything selected or
// edited this session is always shown, so a filter can't hide your work.

import type { Graph, NodeEntity, WayEntity } from "./graph";
import { isClosedWay } from "./geometryRoles";

export interface FeatureCategory {
  id: string;
  label: string;
}

export const FEATURE_CATEGORIES: FeatureCategory[] = [
  { id: "points", label: "Points" },
  { id: "traffic_roads", label: "Traffic roads" },
  { id: "service_roads", label: "Service & tracks" },
  { id: "paths", label: "Paths" },
  { id: "buildings", label: "Buildings" },
  { id: "landuse", label: "Landuse & parks" },
  { id: "water", label: "Water" },
  { id: "rail", label: "Railways" },
  { id: "boundaries", label: "Boundaries" },
  { id: "others", label: "Others" },
  // Not a way/node class: the Map data panel uses this entry to show/hide the notes layer.
  { id: "notes", label: "Notes" },
];

const TRAFFIC = new Set(["motorway", "trunk", "primary", "secondary", "tertiary", "unclassified", "residential", "living_street", "motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link"]);
const PATHS = new Set(["footway", "path", "cycleway", "steps", "pedestrian", "bridleway", "corridor"]);

export function categoryOfWay(way: WayEntity): string {
  const t = way.tags;
  if (t.building && t.building !== "no") return "buildings";
  if (t.highway) {
    if (TRAFFIC.has(t.highway)) return "traffic_roads";
    if (PATHS.has(t.highway)) return "paths";
    return "service_roads"; // service, track, and anything exotic
  }
  if (t.railway) return "rail";
  if (t.waterway || t.natural === "water" || t.natural === "coastline" || t.natural === "wetland") return "water";
  if (t.boundary) return "boundaries";
  if (t.landuse || t.leisure || t.natural) return "landuse";
  return "others";
}

export function isCategoryHidden(category: string, hidden: ReadonlySet<string>): boolean {
  return hidden.has(category);
}

export interface FilteredFeatures {
  ways: readonly WayEntity[];
  nodes: readonly NodeEntity[];
}

// `alwaysShow` holds entity keys ("n5"/"w-1") that must stay visible
// regardless of filters (selection + this session's edits).
export function filterFeatures(graph: Graph, hidden: ReadonlySet<string>, alwaysShow: ReadonlySet<string>): FilteredFeatures {
  const allWays = graph.visibleWays();
  const allNodes = graph.visibleNodes();
  if (hidden.size === 0) return { ways: allWays, nodes: allNodes };

  const ways = allWays.filter((w) => alwaysShow.has(`w${w.id}`) || !hidden.has(categoryOfWay(w)));
  const shownWayIds = new Set(ways.map((w) => w.id));

  // node -> does any (visible-in-graph) way use it, and does any *shown* way?
  const usedBy = new Map<number, boolean>(); // true when at least one shown way uses it
  for (const w of allWays) {
    const shown = shownWayIds.has(w.id);
    for (const id of w.nodeIds) usedBy.set(id, (usedBy.get(id) ?? false) || shown);
  }
  const nodes = allNodes.filter((n) => {
    if (alwaysShow.has(`n${n.id}`)) return true;
    const via = usedBy.get(n.id);
    if (via !== undefined) return via; // a vertex follows its ways
    return !hidden.has("points"); // standalone point
  });
  return { ways, nodes };
}

// Whether the polygon should be treated as an area for filtering — kept
// here so callers don't re-derive it.
export function isAreaWay(way: WayEntity): boolean {
  return isClosedWay(way);
}
