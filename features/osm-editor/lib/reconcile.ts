// After a successful osmChange upload, the server hands back a
// <diffResult> mapping each uploaded element's old id -> real id/version
// (creates get a brand-new positive id; modifies/deletes get a bumped
// version at the same id). This rewrites the local graph to match:
// every entity's own id/version is updated, and every reference to a
// remapped negative id (a way's nd list, a relation's members) is
// rewritten too — without this step, anything drawn in the same session
// that referenced a just-created node would keep pointing at an id the
// server never heard of.
//
// Also detects `if-unused` deletes the server silently skipped (still
// referenced by something outside the loaded bbox): the diffResult
// echoes back a version that isn't newer than what was sent, so instead
// of leaving the entity wrongly marked deleted locally, it's restored
// to visible and surfaced to the caller as a warning.

import type { EntityType, Graph } from "./graph";
import type { GraphDiff } from "./diff";
import type { DiffResultEntry } from "./osmChangeXml";

export interface ReconcileResult {
  graph: Graph;
  skippedDeletes: { type: EntityType; id: number }[];
}

export function applyUploadResult(headGraph: Graph, diff: GraphDiff, results: DiffResultEntry[]): ReconcileResult {
  const sentVersionByKey = new Map<string, number>();
  for (const n of diff.deletedNodes) sentVersionByKey.set(`node:${n.id}`, n.version);
  for (const w of diff.deletedWays) sentVersionByKey.set(`way:${w.id}`, w.version);
  for (const r of diff.deletedRelations) sentVersionByKey.set(`relation:${r.id}`, r.version);

  const idMap = new Map<string, { newId: number; newVersion: number }>();
  const skippedDeletes: { type: EntityType; id: number }[] = [];

  for (const entry of results) {
    const key = `${entry.type}:${entry.oldId}`;
    const sentVersion = sentVersionByKey.get(key);
    if (sentVersion !== undefined && entry.newVersion <= sentVersion) {
      skippedDeletes.push({ type: entry.type, id: entry.oldId });
      continue;
    }
    idMap.set(key, { newId: entry.newId, newVersion: entry.newVersion });
  }

  function remapRef(type: EntityType, id: number): number {
    return idMap.get(`${type}:${id}`)?.newId ?? id;
  }

  let graph = headGraph;
  for (const entity of headGraph.all()) {
    const mapped = idMap.get(`${entity.type}:${entity.id}`);
    const wasSkipped = skippedDeletes.some((s) => s.type === entity.type && s.id === entity.id);

    if (wasSkipped) {
      graph = graph.replace({ ...entity, visible: true });
      continue;
    }

    if (entity.type === "way") {
      const nodeIds = entity.nodeIds.map((id) => remapRef("node", id));
      const updated = mapped ? { ...entity, id: mapped.newId, version: mapped.newVersion, nodeIds } : { ...entity, nodeIds };
      if (mapped) graph = graph.remove("way", entity.id);
      graph = graph.replace(updated);
    } else if (entity.type === "relation") {
      const members = entity.members.map((m) => ({ ...m, ref: remapRef(m.type, m.ref) }));
      const updated = mapped ? { ...entity, id: mapped.newId, version: mapped.newVersion, members } : { ...entity, members };
      if (mapped) graph = graph.remove("relation", entity.id);
      graph = graph.replace(updated);
    } else if (mapped) {
      graph = graph.remove("node", entity.id);
      graph = graph.replace({ ...entity, id: mapped.newId, version: mapped.newVersion });
    }
  }

  return { graph, skippedDeletes };
}
