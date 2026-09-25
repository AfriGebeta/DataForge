// Pure (graph, ...params) => graph transformations — map-editor-full-spec.md
// §1.2's "actions" layer. All data-integrity logic (deleting a node also
// removes it from every way/relation referencing it, a way left with <2
// nodes is deleted too) lives here, isolated from UI/rendering code, so
// undo/redo (history.ts) never needs operation-specific logic.

import type { Graph, NodeEntity, OsmTags, RelationEntity, RelationMember, WayEntity } from "./graph";

export function createNode(graph: Graph, id: number, lat: number, lon: number, tags: OsmTags = {}): Graph {
  const node: NodeEntity = { type: "node", id, version: 0, visible: true, lat, lon, tags };
  return graph.replace(node);
}

export function moveNode(graph: Graph, id: number, lat: number, lon: number): Graph {
  const node = graph.node(id);
  if (!node) return graph;
  return graph.replace({ ...node, lat, lon });
}

export function changeTags(graph: Graph, type: "node" | "way" | "relation", id: number, tags: OsmTags): Graph {
  const entity = graph.get(type, id);
  if (!entity) return graph;
  return graph.replace({ ...entity, tags });
}

export function createWay(graph: Graph, id: number, nodeIds: number[], tags: OsmTags = {}): Graph {
  const way: WayEntity = { type: "way", id, version: 0, visible: true, nodeIds, tags };
  return graph.replace(way);
}

export function reshapeWay(graph: Graph, id: number, nodeIds: number[]): Graph {
  const way = graph.way(id);
  if (!way) return graph;
  return graph.replace({ ...way, nodeIds });
}

// Inserts `nodeId` into `wayId`'s node sequence at `atIndex` — the
// mechanism behind both snap-to-way (drawing/dragging onto a line's
// interior, spec §C3) and midpoint promotion (spec §C4).
export function insertVertexIntoWay(graph: Graph, wayId: number, atIndex: number, nodeId: number): Graph {
  const way = graph.way(wayId);
  if (!way) return graph;
  const nodeIds = way.nodeIds.slice();
  nodeIds.splice(atIndex, 0, nodeId);
  return graph.replace({ ...way, nodeIds });
}

// Removes one occurrence of `nodeId` at `atIndex` from a way — used by
// "disconnect" (pull a shared vertex back out into its own point) and
// vertex-delete-from-way menu operations. Deletes the way outright if
// doing so would leave it with fewer than 2 nodes (spec §C2.10's
// degenerate-result rule applies here too, not just to fresh draws).
export function removeVertexFromWay(graph: Graph, wayId: number, atIndex: number): Graph {
  const way = graph.way(wayId);
  if (!way) return graph;
  const nodeIds = way.nodeIds.slice();
  nodeIds.splice(atIndex, 1);
  if (nodeIds.length < 2) return deleteWay(graph, wayId);
  return graph.replace({ ...way, nodeIds });
}

function stripNodeFromWay(way: WayEntity, nodeId: number): WayEntity {
  return { ...way, nodeIds: way.nodeIds.filter((id) => id !== nodeId) };
}

function stripMemberFromRelation(relation: RelationEntity, type: "node" | "way", id: number): RelationEntity {
  return { ...relation, members: relation.members.filter((m) => !(m.type === type && m.ref === id)) };
}

// Marks an entity gone: if it was ever persisted (positive id), it stays
// in the graph as visible:false so the diff engine emits a real delete;
// if it was only ever a local placeholder (negative id, never
// uploaded), it's dropped from the graph entirely — there is nothing to
// tell the server about.
function retire<T extends { id: number; visible: boolean }>(graph: Graph, entity: T, type: "node" | "way" | "relation"): Graph {
  if (entity.id < 0) return graph.remove(type, entity.id);
  return graph.replace({ ...entity, visible: false } as never);
}

// Deleting a node cascades per spec §1.2/§C2.10: pull it out of every
// way that references it (deleting any way left with <2 nodes) and out
// of every relation's member list, then retire the node itself.
export function deleteNode(graph: Graph, id: number): Graph {
  const node = graph.node(id);
  if (!node) return graph;

  let g = graph;
  for (const way of g.parentWays(id)) {
    const stripped = stripNodeFromWay(way, id);
    g = stripped.nodeIds.length < 2 ? deleteWay(g, way.id) : g.replace(stripped);
  }
  for (const relation of g.parentRelations("node", id)) {
    g = g.replace(stripMemberFromRelation(relation, "node", id));
  }
  return retire(g, node, "node");
}

export function deleteWay(graph: Graph, id: number): Graph {
  const way = graph.way(id);
  if (!way) return graph;

  let g = graph;
  for (const relation of g.parentRelations("way", id)) {
    g = g.replace(stripMemberFromRelation(relation, "way", id));
  }
  return retire(g, way, "way");
}

export function deleteRelation(graph: Graph, id: number): Graph {
  const relation = graph.relation(id);
  if (!relation) return graph;
  return retire(graph, relation, "relation");
}

export function createRelation(graph: Graph, id: number, members: RelationMember[], tags: OsmTags = {}): Graph {
  const relation: RelationEntity = { type: "relation", id, version: 0, visible: true, members, tags };
  return graph.replace(relation);
}

export function reshapeRelation(graph: Graph, id: number, members: RelationMember[]): Graph {
  const relation = graph.relation(id);
  if (!relation) return graph;
  return graph.replace({ ...relation, members });
}

export function addRelationMember(graph: Graph, relationId: number, member: RelationMember): Graph {
  const relation = graph.relation(relationId);
  if (!relation) return graph;
  return graph.replace({ ...relation, members: [...relation.members, member] });
}

export function removeRelationMember(graph: Graph, relationId: number, atIndex: number): Graph {
  const relation = graph.relation(relationId);
  if (!relation) return graph;
  return graph.replace({ ...relation, members: relation.members.filter((_, i) => i !== atIndex) });
}

// Merges `mergeId` into `keepId`: every way/relation reference to
// mergeId is repointed at keepId, then mergeId is retired. Used when a
// drag or a draw-click snaps exactly onto another node (spec §C3/C5).
// Caller is responsible for relation-integrity checks before calling
// this (a merge that would corrupt a multipolygon/turn-restriction is
// blocked at the UI layer, not silently allowed here).
export function mergeNodes(graph: Graph, keepId: number, mergeId: number): Graph {
  if (keepId === mergeId) return graph;
  const merge = graph.node(mergeId);
  if (!merge) return graph;

  let g = graph;
  for (const way of g.parentWays(mergeId)) {
    const nodeIds = way.nodeIds.map((id) => (id === mergeId ? keepId : id));
    // Collapse any immediate duplicate produced by the merge (e.g. two
    // adjacent vertices merging into one) without otherwise reordering.
    const deduped = nodeIds.filter((id, i) => i === 0 || id !== nodeIds[i - 1]);
    g = deduped.length < 2 ? deleteWay(g, way.id) : g.replace({ ...way, nodeIds: deduped });
  }
  for (const relation of g.parentRelations("node", mergeId)) {
    const members = relation.members.map((m) => (m.type === "node" && m.ref === mergeId ? { ...m, ref: keepId } : m));
    g = g.replace({ ...relation, members });
  }
  return retire(g, merge, "node");
}

// Pulls a shared vertex back out into its own standalone point: removes
// it from `wayId` only (leaving it attached to any other ways it's
// still a member of) — the "disconnect" edit-menu operation (§1.4).
export function disconnectNodeFromWay(graph: Graph, wayId: number, nodeId: number): Graph {
  const way = graph.way(wayId);
  if (!way) return graph;
  const atIndex = way.nodeIds.indexOf(nodeId);
  if (atIndex === -1) return graph;
  return removeVertexFromWay(graph, wayId, atIndex);
}

// Splits a way into two at the vertex `nodeId` — the "split way"
// edit-menu operation. The original way keeps nodes [0..splitIndex],
// a brand-new way (id `newWayId`, same tags) gets [splitIndex..end].
export function splitWayAtNode(graph: Graph, wayId: number, nodeId: number, newWayId: number): Graph {
  const way = graph.way(wayId);
  if (!way) return graph;
  const splitIndex = way.nodeIds.indexOf(nodeId);
  if (splitIndex <= 0 || splitIndex >= way.nodeIds.length - 1) return graph;

  const head = way.nodeIds.slice(0, splitIndex + 1);
  const tail = way.nodeIds.slice(splitIndex);
  let g = graph.replace({ ...way, nodeIds: head });
  g = createWay(g, newWayId, tail, way.tags);
  return g;
}

export function reverseWay(graph: Graph, wayId: number): Graph {
  const way = graph.way(wayId);
  if (!way) return graph;
  return graph.replace({ ...way, nodeIds: way.nodeIds.slice().reverse() });
}
