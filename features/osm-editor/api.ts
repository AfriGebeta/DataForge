import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type { BoundingBox, OsmChangeset, OsmMapData, OsmNode, OsmRelation, OsmRelationMember, OsmWay } from "./types";

const OSM_ENDPOINT = `${API_BASE_URL}/api/v1/osm`;

async function messageFromResponse(res: Response): Promise<string> {
  let msg = `Request failed with status ${res.status}`;
  try {
    const body = await res.json();
    if (body?.error) msg = body.error;
  } catch {
    // ignore non-JSON error bodies
  }
  return msg;
}

async function throwOnError(res: Response): Promise<never> {
  throw new Error(await messageFromResponse(res));
}

// Thrown specifically on a 412 from /upload — a real version conflict
// (someone else edited the same area since it was loaded), distinct
// from other failures so the UI can show a dedicated conflict dialog
// instead of a generic error banner (spec §1.10: "clear
// conflict-resolution UI, not a silent failure").
export class OsmConflictError extends Error {}

function bboxQuery(bbox: BoundingBox): string {
  return new URLSearchParams({
    minLat: String(bbox.minLat),
    minLon: String(bbox.minLon),
    maxLat: String(bbox.maxLat),
    maxLon: String(bbox.maxLon),
  }).toString();
}

// GET /osm/map — DataForge's own JSON view of whatever's in the given
// bbox. Real .osm export goes through fetchMapOsmXml below instead.
export async function fetchMapData(bbox: BoundingBox): Promise<OsmMapData> {
  const res = await apiFetch(`${OSM_ENDPOINT}/map?${bboxQuery(bbox)}`);
  if (!res.ok) return throwOnError(res);
  return res.json();
}

// GET /osm/map?format=xml — a real .osm file, for the "Export .osm"
// button. Returned as text (not triggered as a browser navigation)
// because the request needs the same Bearer auth header apiFetch
// attaches everywhere else — a plain <a href> download wouldn't carry it.
export async function fetchMapOsmXml(bbox: BoundingBox): Promise<string> {
  const res = await apiFetch(`${OSM_ENDPOINT}/map?${bboxQuery(bbox)}&format=xml`);
  if (!res.ok) return throwOnError(res);
  return res.text();
}

export function downloadTextFile(filename: string, contents: string, mimeType = "application/xml") {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Changesets ───────────────────────────────────────────────────────

export async function createChangeset(tags: Record<string, string>): Promise<OsmChangeset> {
  const res = await apiFetch(`${OSM_ENDPOINT}/changeset/create`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tags }),
  });
  if (!res.ok) return throwOnError(res);
  return res.json();
}

export async function getChangeset(id: number): Promise<OsmChangeset> {
  const res = await apiFetch(`${OSM_ENDPOINT}/changeset/${id}`);
  if (!res.ok) return throwOnError(res);
  return res.json();
}

export async function closeChangeset(id: number): Promise<void> {
  const res = await apiFetch(`${OSM_ENDPOINT}/changeset/${id}/close`, { method: "PUT" });
  if (!res.ok && res.status !== 204) return throwOnError(res);
}

// GET /osm/changeset/{id}/download — osmChange XML of everything this
// changeset touched. Backs the "Export changeset (.osc)" button.
export async function fetchChangesetOsmChangeXml(id: number): Promise<string> {
  const res = await apiFetch(`${OSM_ENDPOINT}/changeset/${id}/download`);
  if (!res.ok) return throwOnError(res);
  return res.text();
}

// POST /osm/changeset/{id}/upload — a real osmChange bulk upload (see
// lib/osmChangeXml.ts for how a GraphDiff becomes this document). Backs
// the actual save flow: one atomic request for everything changed since
// the last save, full rollback server-side on any failure. Returns the
// raw <diffResult> XML text for lib/reconcile.ts to parse.
export async function uploadOsmChange(changesetId: number, osmChangeXml: string): Promise<string> {
  const res = await apiFetch(`${OSM_ENDPOINT}/changeset/${changesetId}/upload`, {
    method: "POST",
    headers: { "Content-Type": "text/xml" },
    body: osmChangeXml,
  });
  if (res.status === 412) throw new OsmConflictError(await messageFromResponse(res));
  if (!res.ok) return throwOnError(res);
  return res.text();
}

// POST /osm/changeset/{id}/import — a plain .osm file (JOSM/overpass/
// openstreetmap.org export), every element created fresh in this
// changeset. Backs the "Import .osm" button.
export async function importOsmFile(
  changesetId: number,
  xmlText: string,
): Promise<{ imported: number; nodes: number; ways: number; relations: number }> {
  const res = await apiFetch(`${OSM_ENDPOINT}/changeset/${changesetId}/import`, {
    method: "POST",
    headers: { "Content-Type": "application/xml" },
    body: xmlText,
  });
  if (!res.ok) return throwOnError(res);
  return res.json();
}

// ── Nodes ────────────────────────────────────────────────────────────

export async function createNode(
  changesetId: number,
  lat: number,
  lon: number,
  tags: Record<string, string>,
): Promise<OsmNode> {
  const res = await apiFetch(`${OSM_ENDPOINT}/node/create`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ changesetId, lat, lon, tags }),
  });
  if (!res.ok) return throwOnError(res);
  return res.json();
}

export async function updateNode(
  id: number,
  changesetId: number,
  version: number,
  lat: number,
  lon: number,
  tags: Record<string, string>,
): Promise<OsmNode> {
  const res = await apiFetch(`${OSM_ENDPOINT}/node/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ changesetId, version, lat, lon, tags }),
  });
  if (!res.ok) return throwOnError(res);
  return res.json();
}

export async function deleteNode(id: number, changesetId: number, version: number): Promise<void> {
  const res = await apiFetch(`${OSM_ENDPOINT}/node/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ changesetId, version }),
  });
  if (!res.ok) return throwOnError(res);
}

// ── Ways ─────────────────────────────────────────────────────────────

export async function createWay(
  changesetId: number,
  nodeIds: number[],
  tags: Record<string, string>,
): Promise<OsmWay> {
  const res = await apiFetch(`${OSM_ENDPOINT}/way/create`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ changesetId, nodes: nodeIds, tags }),
  });
  if (!res.ok) return throwOnError(res);
  return res.json();
}

export async function updateWay(
  id: number,
  changesetId: number,
  version: number,
  nodeIds: number[],
  tags: Record<string, string>,
): Promise<OsmWay> {
  const res = await apiFetch(`${OSM_ENDPOINT}/way/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ changesetId, version, nodes: nodeIds, tags }),
  });
  if (!res.ok) return throwOnError(res);
  return res.json();
}

export async function deleteWay(id: number, changesetId: number, version: number): Promise<void> {
  const res = await apiFetch(`${OSM_ENDPOINT}/way/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ changesetId, version }),
  });
  if (!res.ok) return throwOnError(res);
}

// ── Relations ────────────────────────────────────────────────────────

export async function createRelation(
  changesetId: number,
  members: OsmRelationMember[],
  tags: Record<string, string>,
): Promise<OsmRelation> {
  const res = await apiFetch(`${OSM_ENDPOINT}/relation/create`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ changesetId, members, tags }),
  });
  if (!res.ok) return throwOnError(res);
  return res.json();
}

export async function getRelation(id: number): Promise<OsmRelation> {
  const res = await apiFetch(`${OSM_ENDPOINT}/relation/${id}`);
  if (!res.ok) return throwOnError(res);
  return res.json();
}

export async function updateRelation(
  id: number,
  changesetId: number,
  version: number,
  members: OsmRelationMember[],
  tags: Record<string, string>,
): Promise<OsmRelation> {
  const res = await apiFetch(`${OSM_ENDPOINT}/relation/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ changesetId, version, members, tags }),
  });
  if (!res.ok) return throwOnError(res);
  return res.json();
}

export async function deleteRelation(id: number, changesetId: number, version: number): Promise<void> {
  const res = await apiFetch(`${OSM_ENDPOINT}/relation/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ changesetId, version }),
  });
  if (!res.ok) return throwOnError(res);
}
