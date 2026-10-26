// Measurement panel math — iD's Measurement pane: for the selection,
// the geometry facts a mapper checks (length, area, node count,
// centroid, bounds).

import * as geo from "./geo";
import type { Graph } from "./graph";
import { isClosedWay } from "./geometryRoles";

export interface Measurement {
  features: number;
  nodes: number;
  lengthMeters: number; // perimeter for areas
  areaSquareMeters: number;
  center: { lat: number; lon: number } | null;
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number } | null;
}

export function measureSelection(graph: Graph, selection: { type: "node" | "way" | "relation"; id: number }[]): Measurement {
  let length = 0;
  let area = 0;
  const nodeIds = new Set<number>();
  for (const s of selection) {
    if (s.type === "node") {
      if (graph.node(s.id)) nodeIds.add(s.id);
    } else if (s.type === "way") {
      const way = graph.way(s.id);
      if (!way) continue;
      const pts = graph.childNodes(way);
      way.nodeIds.forEach((id) => nodeIds.add(id));
      length += geo.pathLengthMeters(pts);
      if (isClosedWay(way)) area += geo.ringAreaSquareMeters(pts.slice(0, -1));
    }
  }
  const pts = [...nodeIds].map((id) => graph.node(id)).filter((n): n is NonNullable<typeof n> => !!n);
  if (pts.length === 0) return { features: selection.length, nodes: 0, lengthMeters: 0, areaSquareMeters: 0, center: null, bounds: null };
  const lats = pts.map((p) => p.lat);
  const lons = pts.map((p) => p.lon);
  return {
    features: selection.length,
    nodes: pts.length,
    lengthMeters: length,
    areaSquareMeters: area,
    center: { lat: (Math.min(...lats) + Math.max(...lats)) / 2, lon: (Math.min(...lons) + Math.max(...lons)) / 2 },
    bounds: { minLat: Math.min(...lats), maxLat: Math.max(...lats), minLon: Math.min(...lons), maxLon: Math.max(...lons) },
  };
}

export function formatLength(m: number): string {
  if (m < 1000) return `${m.toFixed(m < 10 ? 2 : 1)} m`;
  return `${(m / 1000).toFixed(m < 10000 ? 3 : 2)} km`;
}

export function formatArea(m2: number): string {
  if (m2 < 10000) return `${m2.toFixed(m2 < 100 ? 2 : 1)} m²`;
  if (m2 < 1_000_000) return `${(m2 / 10000).toFixed(2)} ha`;
  return `${(m2 / 1_000_000).toFixed(3)} km²`;
}
