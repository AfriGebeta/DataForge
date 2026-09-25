// Derives the four geometry roles from the graph — map-editor-full-spec.md
// §2A: point/vertex/line/area are never stored directly, only computed
// from current graph structure, so a role can (and does) change live
// mid-edit (e.g. a standalone point becomes a vertex the instant a line
// is drawn through it).

import type { Graph, NodeEntity, WayEntity } from "./graph";

export type NodeRole = "point" | "vertex";
export type WayRole = "line" | "area";
export type GeometryRole = NodeRole | WayRole;

export function isClosedWay(way: WayEntity): boolean {
  return way.nodeIds.length >= 4 && way.nodeIds[0] === way.nodeIds[way.nodeIds.length - 1];
}

export function wayRole(way: WayEntity): WayRole {
  return isClosedWay(way) ? "area" : "line";
}

export function nodeRole(graph: Graph, node: NodeEntity): NodeRole {
  return graph.parentWays(node.id).length > 0 ? "vertex" : "point";
}

// §B3's decluttering rule: only "important" vertices render persistently
// (endpoints, junctions shared by >1 way, or vertices carrying their own
// tags) — plain interior shape-points of a line stay invisible in normal
// display. Callers additionally force-render on hover/select/drag per §B3;
// that's UI state, not modeled here.
export function isImportantVertex(graph: Graph, node: NodeEntity): boolean {
  if (Object.keys(node.tags).length > 0) return true;
  const parentWays = graph.parentWays(node.id);
  if (parentWays.length > 1) return true;
  if (parentWays.length === 1) {
    const way = parentWays[0];
    const first = way.nodeIds[0];
    const last = way.nodeIds[way.nodeIds.length - 1];
    if (node.id === first || node.id === last) return true;
  }
  return false;
}

// A dangling/unconnected endpoint: the tip of an open way that isn't
// shared with any other way — rendered 1.5px larger (§B3) so an
// unfinished/broken line is visually obvious.
export function isDanglingEndpoint(graph: Graph, node: NodeEntity): boolean {
  const parentWays = graph.parentWays(node.id);
  if (parentWays.length !== 1) return false;
  const way = parentWays[0];
  if (isClosedWay(way)) return false;
  const first = way.nodeIds[0];
  const last = way.nodeIds[way.nodeIds.length - 1];
  return node.id === first || node.id === last;
}
