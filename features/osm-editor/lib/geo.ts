// Planar geometry helpers for the shape-editing operations (rotate,
// reflect, straighten, orthogonalize, circularize) and the validation
// rules. Everything is done in Web-Mercator meters rather than raw
// lat/lon degrees so angles and distances behave like they do on screen
// (iD does the same, in projected pixel space) — a "90° corner" is only
// 90° in a conformal projection.

const R = 6378137;
const DEG = Math.PI / 180;

export interface Vec {
  x: number;
  y: number;
}

export function project(lat: number, lon: number): Vec {
  const clamped = Math.max(-85.0511, Math.min(85.0511, lat));
  return { x: R * lon * DEG, y: R * Math.log(Math.tan(Math.PI / 4 + (clamped * DEG) / 2)) };
}

export function unproject(v: Vec): { lat: number; lon: number } {
  return { lat: (2 * Math.atan(Math.exp(v.y / R)) - Math.PI / 2) / DEG, lon: v.x / R / DEG };
}

export const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a: Vec, k: number): Vec => ({ x: a.x * k, y: a.y * k });
export const dot = (a: Vec, b: Vec): number => a.x * b.x + a.y * b.y;
export const len = (a: Vec): number => Math.hypot(a.x, a.y);
export const dist = (a: Vec, b: Vec): number => len(sub(a, b));

export function normalize(a: Vec): Vec {
  const l = len(a);
  return l === 0 ? { x: 0, y: 0 } : { x: a.x / l, y: a.y / l };
}

export function rotateAround(p: Vec, center: Vec, angle: number): Vec {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const d = sub(p, center);
  return { x: center.x + d.x * c - d.y * s, y: center.y + d.x * s + d.y * c };
}

export function centroid(points: Vec[]): Vec {
  if (points.length === 0) return { x: 0, y: 0 };
  const sum = points.reduce((acc, p) => add(acc, p), { x: 0, y: 0 });
  return scale(sum, 1 / points.length);
}

// Area-weighted centroid of a closed ring (first point NOT repeated);
// falls back to the vertex mean for degenerate rings. Works relative to
// the first vertex: absolute Web-Mercator coordinates are ~1e6, and the
// cross products below would otherwise lose all precision (and for a
// building-sized ring, even the sign of the area) to cancellation.
export function ringCentroid(ring: Vec[]): Vec {
  if (ring.length === 0) return { x: 0, y: 0 };
  const o = ring[0];
  const r = ring.map((p) => sub(p, o));
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < r.length; i++) {
    const p = r[i];
    const q = r[(i + 1) % r.length];
    const cross = p.x * q.y - q.x * p.y;
    a += cross;
    cx += (p.x + q.x) * cross;
    cy += (p.y + q.y) * cross;
  }
  if (Math.abs(a) < 1e-9) return centroid(ring);
  return add(o, { x: cx / (3 * a), y: cy / (3 * a) });
}

export function signedArea(ring: Vec[]): number {
  if (ring.length === 0) return 0;
  const o = ring[0];
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const p = sub(ring[i], o);
    const q = sub(ring[(i + 1) % ring.length], o);
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

// Projects p onto the infinite line through a→b.
export function projectOnLine(p: Vec, a: Vec, b: Vec): Vec {
  const ab = sub(b, a);
  const l2 = dot(ab, ab);
  if (l2 === 0) return a;
  return add(a, scale(ab, dot(sub(p, a), ab) / l2));
}

// Closest point on the *segment* a→b, plus the 0..1 parameter along it.
export function closestOnSegment(p: Vec, a: Vec, b: Vec): { point: Vec; t: number } {
  const ab = sub(b, a);
  const l2 = dot(ab, ab);
  if (l2 === 0) return { point: a, t: 0 };
  const t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / l2));
  return { point: add(a, scale(ab, t)), t };
}

// Proper segment intersection (shared endpoints and collinear overlaps
// do NOT count — those are connections / duplicates, not crossings).
export function segmentIntersection(a: Vec, b: Vec, c: Vec, d: Vec): Vec | null {
  const r = sub(b, a);
  const s = sub(d, c);
  const denom = r.x * s.y - r.y * s.x;
  if (Math.abs(denom) < 1e-12) return null;
  const qp = sub(c, a);
  const t = (qp.x * s.y - qp.y * s.x) / denom;
  const u = (qp.x * r.y - qp.y * r.x) / denom;
  const EPS = 1e-9;
  if (t <= EPS || t >= 1 - EPS || u <= EPS || u >= 1 - EPS) return null;
  return add(a, scale(r, t));
}

// Convex hull (Andrew's monotone chain).
export function convexHull(points: Vec[]): Vec[] {
  const pts = points.slice().sort((p, q) => p.x - q.x || p.y - q.y);
  if (pts.length < 3) return pts;
  const cross = (o: Vec, a: Vec, b: Vec) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Vec[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Vec[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

// Axes of the minimum-area oriented bounding rectangle — the "long" and
// "short" axes the Reflect operations mirror across (same definition iD
// uses). Returns unit direction vectors and the rectangle center.
export function orientedBoundingAxes(points: Vec[]): { center: Vec; long: Vec; short: Vec } {
  const hull = convexHull(points);
  if (hull.length < 2) {
    const c = centroid(points);
    return { center: c, long: { x: 1, y: 0 }, short: { x: 0, y: 1 } };
  }
  let best: { area: number; angle: number; minX: number; maxX: number; minY: number; maxY: number } | null = null;
  for (let i = 0; i < hull.length; i++) {
    const edge = sub(hull[(i + 1) % hull.length], hull[i]);
    const angle = Math.atan2(edge.y, edge.x);
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of hull) {
      const r = rotateAround(p, { x: 0, y: 0 }, -angle);
      minX = Math.min(minX, r.x);
      maxX = Math.max(maxX, r.x);
      minY = Math.min(minY, r.y);
      maxY = Math.max(maxY, r.y);
    }
    const area = (maxX - minX) * (maxY - minY);
    if (!best || area < best.area) best = { area, angle, minX, maxX, minY, maxY };
  }
  const b = best!;
  const u = { x: Math.cos(b.angle), y: Math.sin(b.angle) };
  const v = { x: -Math.sin(b.angle), y: Math.cos(b.angle) };
  const w = b.maxX - b.minX;
  const h = b.maxY - b.minY;
  const center = rotateAround({ x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 }, { x: 0, y: 0 }, b.angle);
  return w >= h ? { center, long: u, short: v } : { center, long: v, short: u };
}

// Mirrors p across the line through `origin` with direction `axis`.
export function reflectAcross(p: Vec, origin: Vec, axis: Vec): Vec {
  const d = sub(p, origin);
  const a = normalize(axis);
  const along = scale(a, dot(d, a));
  const reflected = sub(scale(along, 2), d);
  return add(origin, reflected);
}

// Ground distance in meters between two lat/lon points (equirectangular
// — plenty accurate for the sub-kilometer comparisons validation needs).
export function meters(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const x = (bLon - aLon) * DEG * Math.cos(((aLat + bLat) / 2) * DEG);
  const y = (bLat - aLat) * DEG;
  return Math.hypot(x, y) * R;
}

// Interior angle at b (degrees, 0..180) of a→b→c.
export function angleAt(a: Vec, b: Vec, c: Vec): number {
  const p = normalize(sub(a, b));
  const q = normalize(sub(c, b));
  return Math.acos(Math.max(-1, Math.min(1, dot(p, q)))) / DEG;
}

// Ray-casting point-in-polygon on a ring (first point NOT repeated).
export function pointInRing(p: Vec, ring: Vec[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i];
    const b = ring[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

// Ground length in meters of a lat/lon polyline.
export function pathLengthMeters(points: { lat: number; lon: number }[]): number {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) total += meters(points[i].lat, points[i].lon, points[i + 1].lat, points[i + 1].lon);
  return total;
}

// Ground area in square meters of a lat/lon ring (first point NOT
// repeated). Mercator areas are inflated by 1/cos²(lat), so scale back.
export function ringAreaSquareMeters(points: { lat: number; lon: number }[]): number {
  if (points.length < 3) return 0;
  const ring = points.map((p) => project(p.lat, p.lon));
  const meanLat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const k = Math.cos(meanLat * DEG);
  return Math.abs(signedArea(ring)) * k * k;
}
