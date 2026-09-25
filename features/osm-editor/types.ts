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

export type BoundingBox = { minLat: number; minLon: number; maxLat: number; maxLon: number };

// A selected point/line on the map — drives the tag-editor panel and
// which endpoints Save/Delete call.
export type Selection = { kind: "node"; node: OsmNode } | { kind: "way"; way: OsmWay };
