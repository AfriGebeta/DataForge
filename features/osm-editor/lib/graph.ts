// Immutable node/way/relation graph — map-editor-full-spec.md §1.2/§2A.
//
// Entities are never mutated in place; every edit produces a new Graph
// wrapping a new Map. Ids are the real OSM-style per-type numeric ids
// (positive once persisted, sequential negative placeholders for
// anything created client-side and not yet uploaded — same convention
// real osmChange uploads use). Because node/way/relation ids live in
// independent namespaces on the backend, entities are keyed in the
// graph by a type-prefixed string ("n5"/"w-1"/"r12", matching real iD's
// own internal id scheme) so a node and a way can never collide.

export type EntityType = "node" | "way" | "relation";
export type OsmTags = Record<string, string>;

interface BaseEntity {
  id: number;
  version: number;
  visible: boolean;
  tags: OsmTags;
}

export interface NodeEntity extends BaseEntity {
  type: "node";
  lat: number;
  lon: number;
}

export interface RelationMember {
  type: EntityType;
  ref: number;
  role: string;
}

export interface WayEntity extends BaseEntity {
  type: "way";
  nodeIds: number[];
}

export interface RelationEntity extends BaseEntity {
  type: "relation";
  members: RelationMember[];
}

export type Entity = NodeEntity | WayEntity | RelationEntity;

const TYPE_PREFIX: Record<EntityType, string> = { node: "n", way: "w", relation: "r" };

export function entityKey(type: EntityType, id: number): string {
  return `${TYPE_PREFIX[type]}${id}`;
}

export function keyOf(entity: Entity): string {
  return entityKey(entity.type, entity.id);
}

export function tagsEqual(a: OsmTags, b: OsmTags): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) => a[k] === b[k]);
}

function arraysEqual<T>(a: T[], b: T[], eq: (x: T, y: T) => boolean = (x, y) => x === y): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => eq(v, b[i]));
}

export function membersEqual(a: RelationMember[], b: RelationMember[]): boolean {
  return arraysEqual(a, b, (x, y) => x.type === y.type && x.ref === y.ref && x.role === y.role);
}

export function entitiesEqual(a: Entity, b: Entity): boolean {
  if (a.type !== b.type || a.visible !== b.visible || !tagsEqual(a.tags, b.tags)) return false;
  if (a.type === "node" && b.type === "node") return a.lat === b.lat && a.lon === b.lon;
  if (a.type === "way" && b.type === "way") return arraysEqual(a.nodeIds, b.nodeIds);
  if (a.type === "relation" && b.type === "relation") return membersEqual(a.members, b.members);
  return true;
}

// Sequential negative-id allocator, one counter per entity type — a
// fresh instance per editing session (module-level counters would leak
// across mounts/tests).
export class PlaceholderIds {
  private counters: Record<EntityType, number> = { node: 0, way: 0, relation: 0 };
  next(type: EntityType): number {
    this.counters[type] -= 1;
    return this.counters[type];
  }

  // Fast-forwards past every negative (not-yet-saved) id already
  // present in a restored graph (crash recovery, lib/autosave.ts) so
  // freshly-allocated ids after a restore can never collide with ones
  // from the snapshot.
  seedFrom(entities: Entity[]): void {
    for (const e of entities) {
      if (e.id < this.counters[e.type]) this.counters[e.type] = e.id;
    }
  }
}

export class Graph {
  private constructor(private readonly entities: ReadonlyMap<string, Entity>) {}

  static empty(): Graph {
    return new Graph(new Map());
  }

  static fromEntities(entities: Entity[]): Graph {
    const map = new Map<string, Entity>();
    for (const e of entities) map.set(keyOf(e), e);
    return new Graph(map);
  }

  get(type: EntityType, id: number): Entity | undefined {
    return this.entities.get(entityKey(type, id));
  }

  node(id: number): NodeEntity | undefined {
    const e = this.get("node", id);
    return e?.type === "node" ? e : undefined;
  }

  way(id: number): WayEntity | undefined {
    const e = this.get("way", id);
    return e?.type === "way" ? e : undefined;
  }

  relation(id: number): RelationEntity | undefined {
    const e = this.get("relation", id);
    return e?.type === "relation" ? e : undefined;
  }

  has(type: EntityType, id: number): boolean {
    return this.entities.has(entityKey(type, id));
  }

  // Returns a new Graph with `entity` set (created or replaced). The
  // underlying Map is shallow-copied — not a true persistent trie, but
  // fine at the bbox-scoped sizes this editor operates on (backend caps
  // a single bbox load at 50,000 nodes).
  replace(entity: Entity): Graph {
    const next = new Map(this.entities);
    next.set(keyOf(entity), entity);
    return new Graph(next);
  }

  remove(type: EntityType, id: number): Graph {
    const key = entityKey(type, id);
    if (!this.entities.has(key)) return this;
    const next = new Map(this.entities);
    next.delete(key);
    return new Graph(next);
  }

  all(): Entity[] {
    return Array.from(this.entities.values());
  }

  nodes(): NodeEntity[] {
    return this.all().filter((e): e is NodeEntity => e.type === "node");
  }

  ways(): WayEntity[] {
    return this.all().filter((e): e is WayEntity => e.type === "way");
  }

  relations(): RelationEntity[] {
    return this.all().filter((e): e is RelationEntity => e.type === "relation");
  }

  visibleNodes(): NodeEntity[] {
    return this.nodes().filter((n) => n.visible);
  }

  visibleWays(): WayEntity[] {
    return this.ways().filter((w) => w.visible);
  }

  visibleRelations(): RelationEntity[] {
    return this.relations().filter((r) => r.visible);
  }

  // Every visible way that references this node — the backbone of
  // geometry-role derivation (vertex vs. point) and cascade-delete.
  parentWays(nodeId: number): WayEntity[] {
    return this.visibleWays().filter((w) => w.nodeIds.includes(nodeId));
  }

  // Every visible relation with a member matching (type, id).
  parentRelations(type: EntityType, id: number): RelationEntity[] {
    return this.visibleRelations().filter((r) => r.members.some((m) => m.type === type && m.ref === id));
  }

  childNodes(way: WayEntity): NodeEntity[] {
    return way.nodeIds.map((id) => this.node(id)).filter((n): n is NodeEntity => !!n);
  }
}
