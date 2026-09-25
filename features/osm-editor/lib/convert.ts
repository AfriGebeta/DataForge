// Converts between PlaceForge's JSON wire shapes (types.ts, capitalized
// relation-member types to match the JSON API) and the internal graph
// model (graph.ts, lowercase member types to match the real osmChange
// XML wire format used for saving — see osmChangeXml.ts).

import type { OsmMapData, OsmRelation, OsmRelationMember } from "../types";
import { Graph, type Entity, type EntityType, type RelationMember } from "./graph";

function tagsOrEmpty(tags: Record<string, string> | null | undefined): Record<string, string> {
  return tags ?? {};
}

function toInternalMemberType(type: OsmRelationMember["type"]): EntityType {
  return type.toLowerCase() as EntityType;
}

export function toApiMemberType(type: EntityType): OsmRelationMember["type"] {
  return (type.charAt(0).toUpperCase() + type.slice(1)) as OsmRelationMember["type"];
}

export function mapDataToGraph(data: OsmMapData): Graph {
  const entities: Entity[] = [];
  for (const n of data.nodes) {
    entities.push({ type: "node", id: n.id, version: n.version, visible: n.visible, lat: n.lat, lon: n.lon, tags: tagsOrEmpty(n.tags) });
  }
  for (const w of data.ways) {
    entities.push({ type: "way", id: w.id, version: w.version, visible: w.visible, nodeIds: w.nodes, tags: tagsOrEmpty(w.tags) });
  }
  for (const r of data.relations) {
    const members: RelationMember[] = r.members.map((m) => ({ type: toInternalMemberType(m.type), ref: m.ref, role: m.role }));
    entities.push({ type: "relation", id: r.id, version: r.version, visible: r.visible, members, tags: tagsOrEmpty(r.tags) });
  }
  return Graph.fromEntities(entities);
}

export function apiRelationToMembers(relation: OsmRelation): RelationMember[] {
  return relation.members.map((m) => ({ type: toInternalMemberType(m.type), ref: m.ref, role: m.role }));
}
