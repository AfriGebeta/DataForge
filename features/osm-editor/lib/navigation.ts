// Selection navigation — iD's select-mode keys: [ ] step along the way a
// vertex belongs to, { } jump to its ends, ⌘↑ select the parent, ⌘↓ the
// child, \ choose which parent way to follow when a vertex is shared, and
// Z zoom to the selection. Pure graph queries; the shortcut layer decides
// what to select.

import { isClosedWay } from "./geometryRoles";
import type { Graph, WayEntity } from "./graph";
import type { Bounds } from "./location";

export type VertexStep = "prev" | "next" | "first" | "last";

// Closed ways repeat their first node at the end; for navigation the ring
// has length - 1 distinct vertices and wraps.
export function vertexStep(way: WayEntity, nodeId: number, step: VertexStep): number | null {
  const closed = isClosedWay(way);
  const ids = closed ? way.nodeIds.slice(0, -1) : way.nodeIds;
  const i = ids.indexOf(nodeId);
  if (i === -1 || ids.length === 0) return null;
  switch (step) {
    case "first":
      return ids[0];
    case "last":
      return ids[ids.length - 1];
    case "prev":
      return i > 0 ? ids[i - 1] : closed ? ids[ids.length - 1] : null;
    case "next":
      return i < ids.length - 1 ? ids[i + 1] : closed ? ids[0] : null;
  }
}

export interface SelectionRef {
  type: "node" | "way" | "relation";
  id: number;
}

// Every point that makes up the selection: nodes, way nodes, and the
// geometry of a relation's node/way members.
function selectionPoints(graph: Graph, selection: SelectionRef[]): { lat: number; lon: number }[] {
  const pts: { lat: number; lon: number }[] = [];
  const seen = new Set<string>();
  const add = (type: "node" | "way" | "relation", id: number) => {
    const key = `${type}${id}`;
    if (seen.has(key)) return;
    seen.add(key);
    if (type === "node") {
      const n = graph.node(id);
      if (n) pts.push({ lat: n.lat, lon: n.lon });
    } else if (type === "way") {
      graph.way(id)?.nodeIds.forEach((nid) => add("node", nid));
    } else {
      const r = graph.relation(id);
      r?.members.forEach((m) => add(m.type, m.ref));
    }
  };
  selection.forEach((s) => add(s.type, s.id));
  return pts;
}

export function selectionBounds(graph: Graph, selection: SelectionRef[]): Bounds | null {
  const pts = selectionPoints(graph, selection);
  if (pts.length === 0) return null;
  const lats = pts.map((p) => p.lat);
  const lons = pts.map((p) => p.lon);
  return { minLat: Math.min(...lats), maxLat: Math.max(...lats), minLon: Math.min(...lons), maxLon: Math.max(...lons) };
}

// iD's "Follow": while drawing from a vertex of an existing way, press F with
// the pointer on another vertex of the SAME way and the line walks along that
// way between them instead of cutting straight across. Returns the node ids
// from `fromId` to `toId` inclusive; on a closed ring it takes the shorter
// way around. Null if either node isn't on the way or they're the same.
export function followPath(way: WayEntity, fromId: number, toId: number): number[] | null {
  if (fromId === toId) return null;
  const closed = isClosedWay(way);
  const ids = closed ? way.nodeIds.slice(0, -1) : way.nodeIds;
  const a = ids.indexOf(fromId);
  const b = ids.indexOf(toId);
  if (a === -1 || b === -1) return null;
  const forward: number[] = [];
  for (let i = a; ; i = (i + 1) % ids.length) {
    forward.push(ids[i]);
    if (i === b) break;
    if (!closed && i === ids.length - 1) break;
  }
  if (!closed) return a <= b ? ids.slice(a, b + 1) : ids.slice(b, a + 1).reverse();
  const backward: number[] = [];
  for (let i = a; ; i = (i - 1 + ids.length) % ids.length) {
    backward.push(ids[i]);
    if (i === b) break;
  }
  return forward.length <= backward.length ? forward : backward;
}

// A way that contains both nodes, if any — the one F follows.
export function commonWay(graph: Graph, aId: number, bId: number): WayEntity | null {
  const aWays = graph.parentWays(aId);
  return aWays.find((w) => w.nodeIds.includes(bId)) ?? null;
}
