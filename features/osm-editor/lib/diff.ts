// Diff engine — map-editor-full-spec.md §1.2: compares two graphs and
// returns created/modified/deleted entity sets, split by type and
// ordered for safe upload (creates: node→way→relation so forward
// references resolve; deletes: relation→way→node so nothing is deleted
// while still referenced by something also being removed this batch).

import { entitiesEqual, type Graph, type NodeEntity, type RelationEntity, type WayEntity } from "./graph";

export interface GraphDiff {
  createdNodes: NodeEntity[];
  createdWays: WayEntity[];
  createdRelations: RelationEntity[];
  modifiedNodes: NodeEntity[];
  modifiedWays: WayEntity[];
  modifiedRelations: RelationEntity[];
  deletedRelations: RelationEntity[];
  deletedWays: WayEntity[];
  deletedNodes: NodeEntity[];
}

export function isDiffEmpty(diff: GraphDiff): boolean {
  return (
    diff.createdNodes.length === 0 &&
    diff.createdWays.length === 0 &&
    diff.createdRelations.length === 0 &&
    diff.modifiedNodes.length === 0 &&
    diff.modifiedWays.length === 0 &&
    diff.modifiedRelations.length === 0 &&
    diff.deletedRelations.length === 0 &&
    diff.deletedWays.length === 0 &&
    diff.deletedNodes.length === 0
  );
}

export function diffCounts(diff: GraphDiff) {
  return {
    created: diff.createdNodes.length + diff.createdWays.length + diff.createdRelations.length,
    modified: diff.modifiedNodes.length + diff.modifiedWays.length + diff.modifiedRelations.length,
    deleted: diff.deletedNodes.length + diff.deletedWays.length + diff.deletedRelations.length,
  };
}

export function diffGraphs(base: Graph, head: Graph): GraphDiff {
  const diff: GraphDiff = {
    createdNodes: [],
    createdWays: [],
    createdRelations: [],
    modifiedNodes: [],
    modifiedWays: [],
    modifiedRelations: [],
    deletedRelations: [],
    deletedWays: [],
    deletedNodes: [],
  };

  for (const entity of head.all()) {
    // A negative id never existed on the server — it's either a fresh
    // create, or (if visible:false) something drawn and deleted again
    // within the same session, which needs no upload entry at all.
    if (entity.id < 0) {
      if (!entity.visible) continue;
      if (entity.type === "node") diff.createdNodes.push(entity);
      else if (entity.type === "way") diff.createdWays.push(entity);
      else diff.createdRelations.push(entity);
      continue;
    }

    const baseEntity = base.get(entity.type, entity.id);
    if (!baseEntity) {
      // Positive id absent from the base graph — defensively treat as
      // a create (e.g. an entity pulled in from outside the loaded bbox).
      if (!entity.visible) continue;
      if (entity.type === "node") diff.createdNodes.push(entity);
      else if (entity.type === "way") diff.createdWays.push(entity);
      else diff.createdRelations.push(entity);
      continue;
    }

    if (baseEntity.visible && !entity.visible) {
      if (entity.type === "node") diff.deletedNodes.push(entity);
      else if (entity.type === "way") diff.deletedWays.push(entity);
      else diff.deletedRelations.push(entity);
      continue;
    }

    if (!entity.visible) continue; // already deleted in base, nothing to do
    if (entitiesEqual(baseEntity, entity)) continue;

    if (entity.type === "node") diff.modifiedNodes.push(entity);
    else if (entity.type === "way") diff.modifiedWays.push(entity);
    else diff.modifiedRelations.push(entity);
  }

  // Entities dropped from the graph entirely (not just flipped
  // invisible) that were visible in base also need a delete entry —
  // this only happens for already-persisted entities, since unsaved
  // (negative-id) entities are simply removed with nothing to diff.
  for (const entity of base.all()) {
    if (!entity.visible) continue;
    if (head.has(entity.type, entity.id)) continue;
    if (entity.type === "node") diff.deletedNodes.push(entity);
    else if (entity.type === "way") diff.deletedWays.push(entity);
    else diff.deletedRelations.push(entity);
  }

  // Delete ordering: relations, then ways, then nodes.
  return diff;
}
