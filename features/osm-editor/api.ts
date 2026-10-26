import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type { BoundingBox, OsmChangeset, OsmChangesetList, OsmMapData, OsmNote, OsmNode, OsmRelation, OsmRelationMember, OsmWay } from "./types";

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

// ── Changeset history (GET /osm/changesets) ─────────────────────────

export interface ChangesetListParams {
  ids?: number[];
  comment?: string;
  open?: boolean;
  from?: string; // YYYY-MM-DD
  to?: string;
  limit?: number;
  offset?: number;
}

export async function listChangesets(params: ChangesetListParams): Promise<OsmChangesetList> {
  const q = new URLSearchParams();
  if (params.ids?.length) q.set("changesets", params.ids.join(","));
  if (params.comment) q.set("comment", params.comment);
  if (params.open !== undefined) q.set("open", String(params.open));
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  q.set("limit", String(params.limit ?? 20));
  q.set("offset", String(params.offset ?? 0));
  const res = await apiFetch(`${OSM_ENDPOINT}/changesets?${q.toString()}`);
  if (!res.ok) return throwOnError(res);
  return res.json();
}

// ── Element history (GET /osm/{type}/{id}/history) ──────────────────

export interface ElementVersion {
  version: number;
  timestamp: string;
  changeset: number;
  visible: boolean;
  tags: Record<string, string>;
}

export async function fetchElementHistory(type: "node" | "way" | "relation", id: number): Promise<ElementVersion[]> {
  const res = await apiFetch(`${OSM_ENDPOINT}/${type}/${id}/history`);
  if (!res.ok) return throwOnError(res);
  const body = (await res.json()) as Record<string, Array<{ version: number; timestamp: string; changeset: number; visible: boolean; tags: Record<string, string> | null }>>;
  const rows = body[`${type}s`] ?? [];
  return rows.map((r) => ({ version: r.version, timestamp: r.timestamp, changeset: r.changeset, visible: r.visible, tags: r.tags ?? {} }));
}

// ── Auto-trace segmentation ─────────────────────────────────────────

// Sends a road-mask mosaic to PlaceForge, which forwards it to the Python
// segmenter. `paths` come back in mosaic pixel coordinates.
export async function segmentArea(image: string, polygon: number[][], size: { width: number; height: number }): Promise<number[][][]> {
  const res = await apiFetch(`${OSM_ENDPOINT}/segment`, jsonInit("POST", { image, polygon, rect: [0, 0, size.width, size.height], sampleScale: 1 }));
  if (!res.ok) return throwOnError(res);
  return ((await res.json()) as { paths: number[][][] }).paths;
}

// ── Server capabilities ─────────────────────────────────────────────

export interface OsmCapabilities {
  areaMax: number;
  tiles?: { google: boolean };
}

export async function fetchCapabilities(): Promise<OsmCapabilities> {
  const res = await apiFetch(`${OSM_ENDPOINT}/capabilities`);
  if (!res.ok) return throwOnError(res);
  return res.json();
}

// ── Locate an element that isn't loaded yet ─────────────────────────

// Returns a representative point for a node/way/relation id so the editor
// can fly there and load its area (search "w123", `#id=r5` links).
// Ways/relations use their /full endpoint and take the first node.
export async function fetchElementLocation(type: "node" | "way" | "relation", id: number): Promise<{ lat: number; lon: number }> {
  if (type === "node") {
    const res = await apiFetch(`${OSM_ENDPOINT}/node/${id}`);
    if (!res.ok) return throwOnError(res);
    const n = (await res.json()) as { lat: number; lon: number };
    return { lat: n.lat, lon: n.lon };
  }
  const res = await apiFetch(`${OSM_ENDPOINT}/${type}/${id}/full`);
  if (!res.ok) return throwOnError(res);
  const body = (await res.json()) as { nodes?: { lat: number; lon: number }[] };
  const first = body.nodes?.[0];
  if (!first) throw new Error(`${type} #${id} has no geometry to show.`);
  return { lat: first.lat, lon: first.lon };
}

// ── Notes ───────────────────────────────────────────────────────────

const jsonInit = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: body === undefined ? undefined : JSON.stringify(body),
});

// `closedDays`: open notes plus those closed within N days (server
// default 7); -1 everything not hidden; 0 open only.
export async function listNotes(bbox: BoundingBox, closedDays?: number): Promise<OsmNote[]> {
  const q = new URLSearchParams(bboxQuery(bbox));
  if (closedDays !== undefined) q.set("closed", String(closedDays));
  const res = await apiFetch(`${OSM_ENDPOINT}/notes?${q.toString()}`);
  if (!res.ok) return throwOnError(res);
  return ((await res.json()) as { notes: OsmNote[] }).notes;
}

export async function getNote(id: number): Promise<OsmNote> {
  const res = await apiFetch(`${OSM_ENDPOINT}/notes/${id}`);
  if (!res.ok) return throwOnError(res);
  return res.json();
}

export async function createNote(lat: number, lon: number, text: string): Promise<OsmNote> {
  const res = await apiFetch(`${OSM_ENDPOINT}/notes`, jsonInit("POST", { lat, lon, text }));
  if (!res.ok) return throwOnError(res);
  return res.json();
}

async function noteAction(id: number, action: "comment" | "close" | "reopen", text: string): Promise<OsmNote> {
  const res = await apiFetch(`${OSM_ENDPOINT}/notes/${id}/${action}`, jsonInit("POST", { text }));
  if (!res.ok) return throwOnError(res);
  return res.json();
}
export const commentNote = (id: number, text: string) => noteAction(id, "comment", text);
export const closeNote = (id: number, text = "") => noteAction(id, "close", text);
export const reopenNote = (id: number, text = "") => noteAction(id, "reopen", text);

export async function hideNote(id: number, text = ""): Promise<void> {
  const res = await apiFetch(`${OSM_ENDPOINT}/notes/${id}`, jsonInit("DELETE", { text }));
  if (!res.ok) return throwOnError(res);
}
