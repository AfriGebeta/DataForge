// Snap hit-testing — map-editor-full-spec.md §B7/§C3: "there's no single
// global snap radius constant — snapping is purely a consequence of the
// invisible hit-testing layer: whenever the interaction point overlaps
// another element's touch target, that counts as a snap candidate."
// This does the pixel-space equivalent (Leaflet has no real DOM hit-test
// layer to query, so it's approximated directly against the spatial
// index using the same touch-target sizes B7 specifies) rather than
// using turf's geo-distance snapping helpers, since the spec's model is
// explicitly screen-pixel-based, not geographic-distance-based.

import type L from "leaflet";
import type { NodeEntity, WayEntity } from "./graph";
import type { SpatialIndex } from "./spatialIndex";

// §2D quick reference: vertex touch target ~matches/slightly exceeds
// the visible circle radius; midpoint touch target is a fixed 8px.
// There's no single spec'd number for "line interior" snapping, so this
// uses the same order of magnitude as the midpoint target.
const NODE_HIT_PX = 10;
const WAY_HIT_PX = 8;

export type SnapResult =
  | { kind: "node"; node: NodeEntity }
  | { kind: "way"; way: WayEntity; segmentIndex: number; lat: number; lon: number }
  | null;

function projectPointOnSegment(p: L.Point, a: L.Point, b: L.Point, pointCtor: typeof L.point): L.Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return a;
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  return pointCtor(a.x + t * dx, a.y + t * dy);
}

// Fixed generous prefilter margin for the rbush bbox query — the real
// precision comes from the pixel-space check below; this just keeps the
// rbush query from scanning the whole loaded bbox on every mousemove.
const PREFILTER_MARGIN_DEG = 0.01;

export function findSnap(
  L: typeof import("leaflet"),
  map: L.Map,
  index: SpatialIndex,
  lat: number,
  lon: number,
  excludeNodeIds: ReadonlySet<number> = new Set(),
): SnapResult {
  const point = map.latLngToContainerPoint([lat, lon]);

  let bestNode: NodeEntity | null = null;
  let bestNodeDist = Infinity;
  for (const node of index.nearbyNodes(lat, lon, PREFILTER_MARGIN_DEG)) {
    if (excludeNodeIds.has(node.id)) continue;
    const p = map.latLngToContainerPoint([node.lat, node.lon]);
    const d = p.distanceTo(point);
    if (d < NODE_HIT_PX && d < bestNodeDist) {
      bestNode = node;
      bestNodeDist = d;
    }
  }
  if (bestNode) return { kind: "node", node: bestNode };

  let best: SnapResult = null;
  let bestDist = Infinity;
  for (const seg of index.nearbySegments(lat, lon, PREFILTER_MARGIN_DEG)) {
    if (excludeNodeIds.has(seg.a.id) || excludeNodeIds.has(seg.b.id)) continue;
    const pa = map.latLngToContainerPoint([seg.a.lat, seg.a.lon]);
    const pb = map.latLngToContainerPoint([seg.b.lat, seg.b.lon]);
    const proj = projectPointOnSegment(point, pa, pb, L.point);
    const d = proj.distanceTo(point);
    if (d < WAY_HIT_PX && d < bestDist) {
      const latlng = map.containerPointToLatLng(proj);
      best = { kind: "way", way: seg.way, segmentIndex: seg.segmentIndex, lat: latlng.lat, lon: latlng.lng };
      bestDist = d;
    }
  }
  return best;
}
