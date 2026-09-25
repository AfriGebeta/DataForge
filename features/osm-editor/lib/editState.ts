// Edit-state diff classification — map-editor-full-spec.md §3.7's
// "highlight edited features" mode: compares an entity against the
// last-saved baseline graph and classifies *what kind* of change it
// carries, so the renderer can color-code accordingly.

import { tagsEqual, type Entity, type Graph } from "./graph";

export type EditState = "added" | "retagged" | "moved" | null;

export function classifyEditState(base: Graph, entity: Entity): EditState {
  if (entity.id < 0) return "added";
  const baseEntity = base.get(entity.type, entity.id);
  if (!baseEntity) return "added";
  if (!baseEntity.visible) return "added"; // recreated after a prior delete, edge case

  const tagsChanged = !tagsEqual(baseEntity.tags, entity.tags);
  let geometryChanged = false;
  if (entity.type === "node" && baseEntity.type === "node") {
    geometryChanged = entity.lat !== baseEntity.lat || entity.lon !== baseEntity.lon;
  } else if (entity.type === "way" && baseEntity.type === "way") {
    geometryChanged = entity.nodeIds.length !== baseEntity.nodeIds.length || entity.nodeIds.some((id, i) => id !== baseEntity.nodeIds[i]);
  } else if (entity.type === "relation" && baseEntity.type === "relation") {
    geometryChanged =
      entity.members.length !== baseEntity.members.length ||
      entity.members.some((m, i) => {
        const b = baseEntity.members[i];
        return !b || m.type !== b.type || m.ref !== b.ref || m.role !== b.role;
      });
  }

  if (!tagsChanged && !geometryChanged) return null;
  if (geometryChanged) return "moved";
  return "retagged";
}
