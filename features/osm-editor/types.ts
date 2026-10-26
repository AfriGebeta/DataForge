// Wire shapes for PlaceForge's OSM-style map editor (JSON side — see
// PlaceForge/src/modules/osm/api/v1/model.go). Real .osm/.osc XML
// interop (import/export) is handled entirely server-side; the frontend
// only ever sees/sends JSON.

export type OsmTags = Record<string, string>;

export type OsmNode = {
  id: number;
  lat: number;
  lon: number;
  version: number;
  changeset: number;
  visible: boolean;
  timestamp: string;
  tags: OsmTags | null;
};

export type OsmWay = {
  id: number;
  nodes: number[];
  version: number;
  changeset: number;
  visible: boolean;
  timestamp: string;
  tags: OsmTags | null;
};

export type OsmRelationMember = { type: "Node" | "Way" | "Relation"; ref: number; role: string };

export type OsmRelation = {
  id: number;
  members: OsmRelationMember[];
  version: number;
  changeset: number;
  visible: boolean;
  timestamp: string;
  tags: OsmTags | null;
};

export type OsmMapData = { nodes: OsmNode[]; ways: OsmWay[]; relations: OsmRelation[] };

export type OsmChangeset = {
  id: number;
  userId: string;
  createdAt: string;
  closedAt: string;
  open: boolean;
  minLat?: number;
  maxLat?: number;
  minLon?: number;
  maxLon?: number;
  numChanges: number;
  tags: OsmTags;
};

export type ChangeCount = { created: number; modified: number; deleted: number };

export type OsmChangesetCounts = { nodes: ChangeCount; ways: ChangeCount; relations: ChangeCount };

// GET /osm/changesets item: a changeset plus per-type counters and the
// owner's identity.
export type OsmChangesetSummary = OsmChangeset & {
  counts: OsmChangesetCounts;
  userEmail?: string;
  userFullName?: string;
};

export type OsmChangesetList = { changesets: OsmChangesetSummary[]; total: number; limit: number; offset: number };

export type BoundingBox = { minLat: number; minLon: number; maxLat: number; maxLon: number };

// A selected point/line on the map — drives the tag-editor panel and
// which endpoints Save/Delete call.
export type Selection = { kind: "node"; node: OsmNode } | { kind: "way"; way: OsmWay };

// ── Map notes (PlaceForge GET/POST /osm/notes…) ──────────────────────

export type NoteEvent = "opened" | "commented" | "closed" | "reopened" | "hidden";

export type OsmNoteComment = {
  id: number;
  date: string;
  userId?: string;
  user?: string; // display name or email
  event: NoteEvent;
  text: string;
};

export type OsmNote = {
  id: number;
  lat: number;
  lon: number;
  status: "open" | "closed";
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  comments: OsmNoteComment[];
};
