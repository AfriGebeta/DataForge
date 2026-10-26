// Locations, tiles and the URL hash — iD's navigation model.
//
// iD keeps the view in the address bar as `#map=<zoom>/<lat>/<lon>` (plus
// `&id=n123,w456` for the selection) so any view is a shareable link. The
// Gebeta iD fork adds jump-to-coordinate and a z/x/y "tile boundary"
// tool. This module is the pure half of both: parsing whatever a person
// pastes ("9.03, 38.74", "17/79640/62234", an OSM URL, "w123"...) and
// formatting the hash. No DOM here, so it's trivially testable.

export type OsmType = "node" | "way" | "relation";

export interface LatLon {
  lat: number;
  lon: number;
}

export interface TileId {
  z: number;
  x: number;
  y: number;
}

export interface Bounds {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
}

// Web-Mercator can't represent the poles.
const MAX_LAT = 85.0511287798;

export function clampLat(lat: number): number {
  return Math.max(-MAX_LAT, Math.min(MAX_LAT, lat));
}

export function validLatLon(lat: number, lon: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}

// ── tiles (slippy-map z/x/y) ───────────────────────────────────────

export function validTile(t: TileId): boolean {
  if (![t.z, t.x, t.y].every(Number.isInteger) || t.z < 0 || t.z > 24) return false;
  const n = 2 ** t.z;
  return t.x >= 0 && t.x < n && t.y >= 0 && t.y < n;
}

export function latLonToTile(lat: number, lon: number, z: number): TileId {
  const n = 2 ** z;
  const latRad = (clampLat(lat) * Math.PI) / 180;
  const x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { z, x: Math.max(0, Math.min(n - 1, x)), y: Math.max(0, Math.min(n - 1, y)) };
}

function tileCorner(x: number, y: number, z: number): LatLon {
  const n = 2 ** z;
  const lon = (x / n) * 360 - 180;
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;
  return { lat, lon };
}

export function tileBounds(t: TileId): Bounds {
  const nw = tileCorner(t.x, t.y, t.z);
  const se = tileCorner(t.x + 1, t.y + 1, t.z);
  return { minLat: se.lat, minLon: nw.lon, maxLat: nw.lat, maxLon: se.lon };
}

export function boundsCenter(b: Bounds): LatLon {
  return { lat: (b.minLat + b.maxLat) / 2, lon: (b.minLon + b.maxLon) / 2 };
}

export function formatTile(t: TileId): string {
  return `${t.z}/${t.x}/${t.y}`;
}

// ── hash: #map=z/lat/lon&id=n1,w2 ──────────────────────────────────

export interface HashState {
  zoom: number;
  lat: number;
  lon: number;
  ids: string[]; // short ids: n123, w-4, r5
}

// iD's coordinate precision grows with zoom so the link stays short but
// still pins the view: ceil(log2(zoom)) decimals.
export function coordPrecision(zoom: number): number {
  return Math.max(0, Math.ceil(Math.log(Math.max(zoom, 1)) / Math.LN2));
}

export function formatMapParam(zoom: number, lat: number, lon: number): string {
  const p = coordPrecision(zoom);
  return `${zoom.toFixed(2)}/${lat.toFixed(p)}/${lon.toFixed(p)}`;
}

function parseQs(hash: string): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = hash.replace(/^[#?]/, "");
  for (const part of raw.split("&")) {
    if (!part) continue;
    const eq = part.indexOf("=");
    const k = decodeURIComponent(eq === -1 ? part : part.slice(0, eq));
    out[k] = eq === -1 ? "" : decodeURIComponent(part.slice(eq + 1));
  }
  return out;
}

// Short element id check: n123 / w-4 / r5 (what graph keys look like), or
// note/42 (iD's form for a selected map note).
function isShortId(s: string): boolean {
  return /^[nwr]-?\d+$/.test(s) || /^note\/\d+$/.test(s);
}

export function parseHash(hash: string): Partial<HashState> {
  const q = parseQs(hash);
  const out: Partial<HashState> = {};
  if (q.map) {
    const [z, lat, lon] = q.map.split("/").map(Number);
    if ([z, lat, lon].every(Number.isFinite) && validLatLon(lat, lon) && z >= 0 && z <= 24) {
      out.zoom = z;
      out.lat = clampLat(lat);
      out.lon = lon;
    }
  }
  if (q.id) out.ids = q.id.split(",").map((s) => s.replace(/^(node|way|relation)\//, (_, t) => t[0])).filter(isShortId);
  return out;
}

// Merges the view/selection into an existing hash, preserving every
// parameter we don't own (comment, source, ...) — iD does the same.
export function updateHash(existing: string, view: { zoom: number; lat: number; lon: number }, ids: string[]): string {
  const q = parseQs(existing);
  delete q.id;
  q.map = formatMapParam(view.zoom, view.lat, view.lon);
  if (ids.length > 0) q.id = ids.join(",");
  // `map` first like iD, then id, then the rest; "/" and "," stay readable.
  const order = ["map", "id", ...Object.keys(q).filter((k) => k !== "map" && k !== "id")];
  return "#" + order.filter((k) => k in q).map((k) => `${k}=${encodeURIComponent(q[k]).replace(/%2F/gi, "/").replace(/%2C/gi, ",")}`).join("&");
}

// Legacy deep links used ?lat=&lon=&zoom= — still honored.
export function parseLegacyQuery(search: string): Partial<HashState> {
  const q = parseQs(search);
  const lat = Number(q.lat);
  const lon = Number(q.lon);
  if (q.lat && q.lon && validLatLon(lat, lon)) {
    const zoom = Number(q.zoom);
    return { lat: clampLat(lat), lon, zoom: Number.isFinite(zoom) && zoom > 0 ? zoom : 17 };
  }
  return {};
}

// ── "go to" input parsing ──────────────────────────────────────────

export type ParsedLocation =
  | { kind: "latlon"; lat: number; lon: number; zoom?: number }
  | { kind: "tile"; tile: TileId }
  | { kind: "element"; type: OsmType; id: number }
  | { kind: "bounds"; bounds: Bounds };

const TYPE_BY_LETTER: Record<string, OsmType> = { n: "node", w: "way", r: "relation" };

function dmsToDeg(deg: string, min?: string, sec?: string, hemi?: string): number {
  let v = Math.abs(Number(deg)) + (min ? Number(min) / 60 : 0) + (sec ? Number(sec) / 3600 : 0);
  if (hemi && /[SWsw]/.test(hemi)) v = -v;
  else if (!hemi && Number(deg) < 0) v = -v;
  return v;
}

// Accepts everything a mapper realistically pastes:
//   9.03, 38.74            decimal, comma/space/semicolon separated
//   9.03 N 38.74 E         hemisphere letters
//   9°1'48"N 38°44'24"E    degrees/minutes/seconds
//   17/9.03/38.74          z/lat/lon  (iD hash form, also "map=17/9.03/38.74")
//   17/79640/62234         tile z/x/y (integers inside the tile grid)
//   n123, way/45, r6       OSM element ids
//   https://www.openstreetmap.org/#map=17/9.03/38.74  or  .../node/123
//   38.7,9.0,38.8,9.1      minLon,minLat,maxLon,maxLat is NOT guessed: use the Bounds tab
export function parseLocationInput(input: string): ParsedLocation | null {
  let text = input.trim();
  if (!text) return null;

  // URLs: pull out the map hash or the element path.
  if (/^https?:\/\//i.test(text)) {
    const hashIdx = text.indexOf("#");
    if (hashIdx !== -1) {
      const h = parseHash(text.slice(hashIdx));
      if (h.lat !== undefined && h.lon !== undefined) return { kind: "latlon", lat: h.lat, lon: h.lon, zoom: h.zoom };
    }
    const m = /\/(node|way|relation)\/(\d+)/.exec(text);
    if (m) return { kind: "element", type: m[1] as OsmType, id: Number(m[2]) };
    return null;
  }
  text = text.replace(/^map=/i, "");

  // element ids: n123 / node 123 / node/123
  const el = /^(node|way|relation|n|w|r)[\s/]*(-?\d+)$/i.exec(text);
  if (el) {
    const t = el[1].toLowerCase();
    return { kind: "element", type: t.length === 1 ? TYPE_BY_LETTER[t] : (t as OsmType), id: Number(el[2]) };
  }

  // slash forms: z/lat/lon (iD hash) or z/x/y (slippy tile). Ambiguous
  // only for tiny integers; the rule: all-integer values that fit the tile
  // grid are a tile when x or y can't possibly be a latitude/longitude
  // (the usual case — real tiles at useful zooms are big numbers),
  // otherwise it's z/lat/lon.
  const slash = text.split("/").map((s) => s.trim());
  if (slash.length === 3 && slash.every((s) => /^-?\d+(\.\d+)?$/.test(s))) {
    const [a, b, c] = slash.map(Number);
    const tile: TileId = { z: a, x: b, y: c };
    const allInts = slash.every((s) => /^\d+$/.test(s));
    if (allInts && validTile(tile) && (b > 90 || c > 180)) return { kind: "tile", tile };
    if (a >= 0 && a <= 24 && validLatLon(b, c)) return { kind: "latlon", lat: clampLat(b), lon: c, zoom: a };
    if (allInts && validTile(tile)) return { kind: "tile", tile };
    return null;
  }

  // DMS pairs: 9°1'48"N 38°44'24"E
  const dms = /^(-?\d+(?:\.\d+)?)\s*[°d]\s*(?:(\d+(?:\.\d+)?)\s*['′m]\s*)?(?:(\d+(?:\.\d+)?)\s*["″s]\s*)?([NSns])?[\s,;]+(-?\d+(?:\.\d+)?)\s*[°d]\s*(?:(\d+(?:\.\d+)?)\s*['′m]\s*)?(?:(\d+(?:\.\d+)?)\s*["″s]\s*)?([EWew])?$/.exec(text);
  if (dms) {
    const lat = dmsToDeg(dms[1], dms[2], dms[3], dms[4]);
    const lon = dmsToDeg(dms[5], dms[6], dms[7], dms[8]);
    return validLatLon(lat, lon) ? { kind: "latlon", lat, lon } : null;
  }

  // decimal pair, optionally with N/S/E/W letters in either order
  const dec = /^([+-]?\d+(?:\.\d+)?)\s*°?\s*([NSns])?[\s,;]+([+-]?\d+(?:\.\d+)?)\s*°?\s*([EWew])?$/.exec(text);
  if (dec) {
    let lat = Number(dec[1]);
    let lon = Number(dec[3]);
    if (dec[2] && /[Ss]/.test(dec[2])) lat = -Math.abs(lat);
    if (dec[4] && /[Ww]/.test(dec[4])) lon = -Math.abs(lon);
    return validLatLon(lat, lon) ? { kind: "latlon", lat, lon } : null;
  }
  return null;
}

// ── display helpers ────────────────────────────────────────────────

export function formatDms(value: number, axis: "lat" | "lon"): string {
  const hemi = axis === "lat" ? (value >= 0 ? "N" : "S") : value >= 0 ? "E" : "W";
  const abs = Math.abs(value);
  const d = Math.floor(abs);
  const mFull = (abs - d) * 60;
  const m = Math.floor(mFull);
  const s = (mFull - m) * 60;
  return `${d}°${String(m).padStart(2, "0")}′${s.toFixed(2).padStart(5, "0")}″${hemi}`;
}

export function formatDecimal(lat: number, lon: number, digits = 6): string {
  return `${lat.toFixed(digits)}, ${lon.toFixed(digits)}`;
}

// Street-level photos: a link to Mapillary centered on the current view. (We
// open it rather than embed a viewer — embedding needs a Mapillary access
// token and its viewer SDK.) Zoom is capped because Mapillary's own map tops
// out around 17-18.
export function streetLevelUrl(lat: number, lon: number, zoom: number): string {
  const z = Math.max(1, Math.min(17, Math.round(zoom)));
  return `https://www.mapillary.com/app/?lat=${lat.toFixed(6)}&lng=${lon.toFixed(6)}&z=${z}`;
}
