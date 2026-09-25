// Client-side osmChange XML serialization/parsing — the wire format
// PlaceForge's `POST /osm/changeset/{id}/upload` speaks (see
// PlaceForge/src/modules/osm/api/v1/xml.go, which this mirrors exactly:
// <create>/<modify>/<delete> blocks, `if-unused` as a block-level
// attribute applying to every element inside it, tags as <tag k=""
// v=""/> children, way membership as <nd ref=""/>, relation membership
// as <member type="" ref="" role=""/>). Building this from our own
// GraphDiff (not the individual create/update/delete REST calls) is
// what makes a multi-entity edit (e.g. a new tagged line = N nodes + 1
// way) land as one atomic upload instead of N+1 separate requests.

import type { GraphDiff } from "./diff";
import type { NodeEntity, OsmTags, RelationEntity, RelationMember, WayEntity } from "./graph";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tagsXml(tags: OsmTags): string {
  return Object.entries(tags)
    .map(([k, v]) => `<tag k="${escapeXml(k)}" v="${escapeXml(v)}"/>`)
    .join("");
}

function nodeXml(n: NodeEntity, includeVersion: boolean): string {
  const version = includeVersion ? ` version="${n.version}"` : "";
  return `<node id="${n.id}" visible="${n.visible}"${version} lat="${n.lat}" lon="${n.lon}">${tagsXml(n.tags)}</node>`;
}

function wayXml(w: WayEntity, includeVersion: boolean): string {
  const version = includeVersion ? ` version="${w.version}"` : "";
  const nds = w.nodeIds.map((id) => `<nd ref="${id}"/>`).join("");
  return `<way id="${w.id}" visible="${w.visible}"${version}>${nds}${tagsXml(w.tags)}</way>`;
}

function memberXml(m: RelationMember): string {
  return `<member type="${m.type}" ref="${m.ref}" role="${escapeXml(m.role)}"/>`;
}

function relationXml(r: RelationEntity, includeVersion: boolean): string {
  const version = includeVersion ? ` version="${r.version}"` : "";
  const members = r.members.map(memberXml).join("");
  return `<relation id="${r.id}" visible="${r.visible}"${version}>${members}${tagsXml(r.tags)}</relation>`;
}

// Builds the full <osmChange> document for one upload. Create-block
// element order is nodes -> ways -> relations, which is what lets a
// newly-created way's <nd ref="-1"/> resolve against a negative node id
// declared earlier in the very same document (server resolves
// placeholders in document order, not by type — see xml.go's comment on
// parseOsmChange). Delete-block order is the reverse (relations -> ways
// -> nodes) and every delete is marked if-unused="true": a node/way
// this session doesn't know is still referenced by something outside
// the loaded bbox gets silently skipped by the server instead of
// aborting the whole upload — detected afterward by comparing the
// returned new_version to what was sent (see parseDiffResult).
export function diffToOsmChangeXml(diff: GraphDiff): string {
  const parts: string[] = ['<?xml version="1.0" encoding="UTF-8"?>', '<osmChange version="0.6" generator="gebeta-forge-osm-editor">'];

  const hasCreate = diff.createdNodes.length || diff.createdWays.length || diff.createdRelations.length;
  if (hasCreate) {
    parts.push("<create>");
    for (const n of diff.createdNodes) parts.push(nodeXml(n, false));
    for (const w of diff.createdWays) parts.push(wayXml(w, false));
    for (const r of diff.createdRelations) parts.push(relationXml(r, false));
    parts.push("</create>");
  }

  const hasModify = diff.modifiedNodes.length || diff.modifiedWays.length || diff.modifiedRelations.length;
  if (hasModify) {
    parts.push("<modify>");
    for (const n of diff.modifiedNodes) parts.push(nodeXml(n, true));
    for (const w of diff.modifiedWays) parts.push(wayXml(w, true));
    for (const r of diff.modifiedRelations) parts.push(relationXml(r, true));
    parts.push("</modify>");
  }

  const hasDelete = diff.deletedNodes.length || diff.deletedWays.length || diff.deletedRelations.length;
  if (hasDelete) {
    parts.push('<delete if-unused="true">');
    for (const r of diff.deletedRelations) parts.push(relationXml(r, true));
    for (const w of diff.deletedWays) parts.push(wayXml(w, true));
    for (const n of diff.deletedNodes) parts.push(nodeXml(n, true));
    parts.push("</delete>");
  }

  parts.push("</osmChange>");
  return parts.join("");
}

export type EntityKind = "node" | "way" | "relation";

export interface DiffResultEntry {
  type: EntityKind;
  oldId: number;
  newId: number;
  newVersion: number;
}

// Parses PlaceForge's <diffResult> response. Requires a DOM (client-only
// — osm-editor is a "use client" feature throughout, so this is never
// called during SSR).
export function parseDiffResult(xml: string): DiffResultEntry[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const errorNode = doc.querySelector("parsererror");
  if (errorNode) throw new Error("Failed to parse diffResult XML from the server.");

  const entries: DiffResultEntry[] = [];
  for (const el of Array.from(doc.documentElement.children)) {
    const type = el.tagName as EntityKind;
    if (type !== "node" && type !== "way" && type !== "relation") continue;
    entries.push({
      type,
      oldId: Number(el.getAttribute("old_id")),
      newId: Number(el.getAttribute("new_id")),
      newVersion: Number(el.getAttribute("new_version")),
    });
  }
  return entries;
}
