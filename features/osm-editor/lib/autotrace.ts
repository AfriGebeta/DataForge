// Auto-trace — the pure half. The tool stitches road-mask tiles into one
// image, the Python segmenter returns pixel polylines, and this module maps
// those back to the world and turns them into ways. Kept free of DOM/React so
// it can be tested on its own.

import RBush from "rbush";
import type { BBox } from "rbush";
import { createNode, createWay, insertVertexIntoWay } from "./actions";
import * as geo from "./geo";
import type { Graph, OsmTags } from "./graph";
import { clampLat, latLonToTile, type Bounds, type LatLon } from "./location";

export const TILE_PX = 256;
export const MAX_MOSAIC_TILES = 36; // 6 x 6 — keeps the request and the canvas small

export interface MosaicPlan {
  z: number;
  x0: number;
  y0: number;
  cols: number;
  rows: number;
  width: number; // px
  height: number; // px
}

// Fractional slippy-map "world pixel" coordinates at zoom z.
function worldPixel(lat: number, lon: number, z: number): { x: number; y: number } {
  const n = TILE_PX * 2 ** z;
  const latRad = (clampLat(lat) * Math.PI) / 180;
  return { x: ((lon + 180) / 360) * n, y: ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n };
}

function worldPixelToLatLon(x: number, y: number, z: number): LatLon {
  const n = TILE_PX * 2 ** z;
  return { lon: (x / n) * 360 - 180, lat: (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI };
}

export function planMosaic(bounds: Bounds, z: number): MosaicPlan {
  const a = latLonToTile(bounds.maxLat, bounds.minLon, z); // north-west
  const b = latLonToTile(bounds.minLat, bounds.maxLon, z); // south-east
  const cols = b.x - a.x + 1;
  const rows = b.y - a.y + 1;
  return { z, x0: a.x, y0: a.y, cols, rows, width: cols * TILE_PX, height: rows * TILE_PX };
}

// The sharpest zoom (<= maxZ) whose mosaic still fits in MAX_MOSAIC_TILES;
// null when even minZ doesn't — the box is too big to trace in one go.
export function chooseMosaic(bounds: Bounds, minZ = 15, maxZ = 19): MosaicPlan | null {
  for (let z = maxZ; z >= minZ; z--) {
    const plan = planMosaic(bounds, z);
    if (plan.cols * plan.rows <= MAX_MOSAIC_TILES) return plan;
  }
  return null;
}

export function pixelToLatLon(plan: MosaicPlan, px: number, py: number): LatLon {
  return worldPixelToLatLon(plan.x0 * TILE_PX + px, plan.y0 * TILE_PX + py, plan.z);
}

export function latLonToPixel(plan: MosaicPlan, lat: number, lon: number): { x: number; y: number } {
  const w = worldPixel(lat, lon, plan.z);
  return { x: w.x - plan.x0 * TILE_PX, y: w.y - plan.y0 * TILE_PX };
}

export function pathsToLatLon(plan: MosaicPlan, paths: number[][][]): LatLon[][] {
  return paths.map((path) => path.map(([px, py]) => pixelToLatLon(plan, px, py)));
}

// The box as a polygon in mosaic pixels — tells the segmenter to ignore the
// part of the mosaic outside what the user drew (tiles overshoot the box).
export function boundsToPixelPolygon(plan: MosaicPlan, b: Bounds): number[][] {
  const nw = latLonToPixel(plan, b.maxLat, b.minLon);
  const se = latLonToPixel(plan, b.minLat, b.maxLon);
  return [
    [nw.x, nw.y],
    [se.x, nw.y],
    [se.x, se.y],
    [nw.x, se.y],
  ];
}

export function lineLengthMeters(line: LatLon[]): number {
  return geo.pathLengthMeters(line);
}

// ── lines -> ways ──────────────────────────────────────────────────

interface NodeItem extends BBox {
  id: number;
  lat: number;
  lon: number;
}

export interface TraceOptions {
  tags: OsmTags;
  // Points closer than this to an existing/just-made node reuse it, so traced
  // roads share junction nodes instead of stacking duplicates (meters).
  mergeMeters?: number;
  // A line's END points this close to an existing way's segment are spliced
  // into it, so the traced road actually connects to the network (meters).
  connectMeters?: number;
}

export interface TraceResult {
  graph: Graph;
  wayIds: number[];
  nodesCreated: number;
  waysConnected: number; // existing ways a traced road was spliced into
}

const DEG_PER_M = 1 / 111320;

export function traceToGraph(graph: Graph, lines: LatLon[][], allocate: (type: "node" | "way") => number, opts: TraceOptions): TraceResult {
  const merge = opts.mergeMeters ?? 1.5;
  const connect = opts.connectMeters ?? 3;
  const tree = new RBush<NodeItem>();
  tree.load(graph.visibleNodes().map((n) => ({ minX: n.lon, maxX: n.lon, minY: n.lat, maxY: n.lat, id: n.id, lat: n.lat, lon: n.lon })));

  let g = graph;
  const wayIds: number[] = [];
  let nodesCreated = 0;
  let waysConnected = 0;

  const nearestNode = (p: LatLon, meters: number): NodeItem | null => {
    const pad = meters * DEG_PER_M * 1.5;
    let best: NodeItem | null = null;
    let bestD = meters;
    for (const c of tree.search({ minX: p.lon - pad, maxX: p.lon + pad, minY: p.lat - pad, maxY: p.lat + pad })) {
      const d = geo.meters(p.lat, p.lon, c.lat, c.lon);
      if (d <= bestD) {
        best = c;
        bestD = d;
      }
    }
    return best;
  };

  const nodeFor = (p: LatLon): number => {
    const hit = nearestNode(p, merge);
    if (hit) return hit.id;
    const id = allocate("node");
    g = createNode(g, id, p.lat, p.lon, {});
    tree.insert({ minX: p.lon, maxX: p.lon, minY: p.lat, maxY: p.lat, id, lat: p.lat, lon: p.lon });
    nodesCreated++;
    return id;
  };

  // Splice `p` into the nearest existing way segment within `connect`
  // meters (not touching a way the line itself just created).
  const connectEnd = (nodeId: number, p: LatLon, own: Set<number>) => {
    if (g.parentWays(nodeId).some((w) => !own.has(w.id))) return; // already on a pre-existing way
    const pv = geo.project(p.lat, p.lon);
    let best: { wayId: number; at: number; point: LatLon; d: number } | null = null;
    for (const w of graph.visibleWays()) {
      if (own.has(w.id)) continue;
      const pts = w.nodeIds.map((id) => graph.node(id));
      if (pts.some((n) => !n)) continue;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = geo.project(pts[i]!.lat, pts[i]!.lon);
        const b = geo.project(pts[i + 1]!.lat, pts[i + 1]!.lon);
        const { point } = geo.closestOnSegment(pv, a, b);
        const ll = geo.unproject(point);
        const d = geo.meters(p.lat, p.lon, ll.lat, ll.lon);
        if (d <= connect && (!best || d < best.d)) best = { wayId: w.id, at: i + 1, point: ll, d };
      }
    }
    if (!best) return;
    const node = g.node(nodeId);
    if (!node) return;
    g = g.replace({ ...node, lat: best.point.lat, lon: best.point.lon });
    g = insertVertexIntoWay(g, best.wayId, best.at, nodeId);
    waysConnected++;
  };

  for (const line of lines) {
    if (line.length < 2) continue;
    const ids: number[] = [];
    for (const p of line) {
      const id = nodeFor(p);
      if (ids[ids.length - 1] !== id) ids.push(id); // collapse consecutive repeats
    }
    if (ids.length < 2) continue;
    const wayId = allocate("way");
    g = createWay(g, wayId, ids, opts.tags);
    wayIds.push(wayId);
    const own = new Set(wayIds);
    connectEnd(ids[0], line[0], own);
    connectEnd(ids[ids.length - 1], line[line.length - 1], own);
  }
  return { graph: g, wayIds, nodesCreated, waysConnected };
}
