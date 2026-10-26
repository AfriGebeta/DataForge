// Stacked-road detection — two highway ways drawn on top of each other
// (a road imported/drawn twice, or a duplicate left behind by a failed save).
// They don't cross, so the crossing-ways rule never sees them, but they
// double-render, break routing and are the usual cause of conflicting saves.
//
// Two tiers:
//  - "stacked": a segment of A has its endpoints and midpoint within
//    TOLERANCE_M of B's line (an exact duplicate).
//  - "parallel": a segment of A runs within NEAR_M of a segment of B at nearly
//    the same bearing — a second copy drawn a few metres off, as happens when
//    the same road is traced twice. A dual carriageway (two one-way roads
//    running in opposite directions) and a footpath beside a road are
//    legitimate and skipped; two one-way roads running the SAME way are not.
//  - "fork": the two ways share a node and leave it the same way, one running
//    on top of the other (a branch that was drawn twice from the same point).
// The overlap is the summed length of qualifying segments.

import RBush from "rbush";
import type { BBox } from "rbush";
import type { Graph, WayEntity } from "./graph";
import * as geo from "./geo";

const TOLERANCE_M = 2.5;
const MIN_OVERLAP_M = 8;
const NEAR_M = 6;
const MIN_PARALLEL_OVERLAP_M = 15;
const MAX_BEARING_DIFF_RAD = (15 * Math.PI) / 180;
// Tighter than the side-by-side tier: a ramp or lane split leaves a shared node
// at a shallow angle too, so a fork only counts when the two are nearly
// coincident, and only for roads of the same type.
const FORK_ANGLE_RAD = (10 * Math.PI) / 180;
const FORK_SEPARATION_M = 3;
const MIN_FORK_OVERLAP_M = 4;
// Degrees of padding for the bbox prefilter (~11 m); precision comes from the
// distance test below.
const BOX_PAD_DEG = 0.0001;

export interface StackedPair {
  kind: "stacked" | "fork" | "parallel";
  a: WayEntity;
  b: WayEntity;
  overlapMeters: number;
  // The stretches of `a` that sit on `b`, for drawing on the map.
  stretches: { lat: number; lon: number }[][];
  location: { lat: number; lon: number };
}

interface Box extends BBox {
  way: WayEntity;
}

function isRoad(way: WayEntity): boolean {
  return !!way.tags.highway && way.tags.area !== "yes";
}

function separatedVertically(a: WayEntity, b: WayEntity): boolean {
  const passes = (w: WayEntity) => !!(w.tags.bridge && w.tags.bridge !== "no") || !!(w.tags.tunnel && w.tags.tunnel !== "no") || w.tags.covered === "yes" || !!w.tags.culvert;
  const layer = (w: WayEntity) => {
    const n = Number(w.tags.layer ?? "0");
    return Number.isFinite(n) ? n : 0;
  };
  return passes(a) || passes(b) || layer(a) !== layer(b);
}

const PATH_HIGHWAYS = new Set(["footway", "path", "cycleway", "steps", "pedestrian", "bridleway", "corridor"]);

// +1 for a one-way road drawn in its travel direction, -1 for oneway=-1, 0 if
// it isn't one-way (or is a roundabout, whose circulating halves legitimately
// run side by side in "opposite" bearings).
function onewaySign(way: WayEntity): number {
  if (way.tags.junction === "roundabout") return 0;
  const v = way.tags.oneway;
  if (v === "yes" || v === "true" || v === "1") return 1;
  if (v === "-1") return -1;
  return 0;
}

// Whether a near-parallel pair is plausibly intended and so shouldn't be
// flagged: a path running beside a road, or a roundabout pair. (Dual
// carriageways are handled per segment by direction, in hasParallelCounterpart.)
function parallelIsLegitimate(a: WayEntity, b: WayEntity): boolean {
  if (a.tags.junction === "roundabout" || b.tags.junction === "roundabout") return true;
  return PATH_HIGHWAYS.has(a.tags.highway) !== PATH_HIGHWAYS.has(b.tags.highway);
}

// Angle between two directed vectors, 0..π.
function directedDiff(a1: geo.Vec, a2: geo.Vec, b1: geo.Vec, b2: geo.Vec): number {
  const d = Math.abs(Math.atan2(a2.y - a1.y, a2.x - a1.x) - Math.atan2(b2.y - b1.y, b2.x - b1.x)) % (2 * Math.PI);
  return d > Math.PI ? 2 * Math.PI - d : d;
}

// Smallest angle between two undirected lines.
function bearingDiff(a1: geo.Vec, a2: geo.Vec, b1: geo.Vec, b2: geo.Vec): number {
  const d = directedDiff(a1, a2, b1, b2);
  return Math.min(d, Math.PI - d);
}

// Whether segment s→e has a counterpart in `line`: both ends and the midpoint
// within NEAR_M of one segment of it, running at a similar bearing. When both
// ways are one-way, the travel directions must also agree — opposite
// directions are a dual carriageway.
function hasParallelCounterpart(s: geo.Vec, e: geo.Vec, line: geo.Vec[], signA: number, signB: number): boolean {
  const mid = geo.scale(geo.add(s, e), 0.5);
  const directional = signA !== 0 && signB !== 0;
  for (let i = 0; i < line.length - 1; i++) {
    const c = line[i];
    const d = line[i + 1];
    if (geo.dist(mid, geo.closestOnSegment(mid, c, d).point) > NEAR_M) continue;
    if (geo.dist(s, geo.closestOnSegment(s, c, d).point) > NEAR_M) continue;
    if (geo.dist(e, geo.closestOnSegment(e, c, d).point) > NEAR_M) continue;
    if (directional) {
      // Compare travel directions: flip a segment's drawn direction for oneway=-1.
      const [a1, a2] = signA > 0 ? [s, e] : [e, s];
      const [b1, b2] = signB > 0 ? [c, d] : [d, c];
      if (directedDiff(a1, a2, b1, b2) <= MAX_BEARING_DIFF_RAD) return true;
    } else if (bearingDiff(s, e, c, d) <= MAX_BEARING_DIFF_RAD) {
      return true;
    }
  }
  return false;
}

function distanceToLine(p: geo.Vec, line: geo.Vec[]): number {
  let best = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    const d = geo.dist(p, geo.closestOnSegment(p, line[i], line[i + 1]).point);
    if (d < best) best = d;
  }
  return best;
}

interface Coverage {
  exact: number;
  near: number;
  exactStretches: { lat: number; lon: number }[][];
  nearStretches: { lat: number; lon: number }[][];
}

// How much of `pts` lies on `lineB` — exactly (within TOLERANCE_M) and, for
// roads that may be a near-copy, loosely (within NEAR_M at a matching bearing).
function coverage(pts: { lat: number; lon: number; p: geo.Vec }[], lineB: geo.Vec[], checkParallel: boolean, signA: number, signB: number): Coverage {
  const out: Coverage = { exact: 0, near: 0, exactStretches: [], nearStretches: [] };
  let curExact: { lat: number; lon: number }[] | null = null;
  let curNear: { lat: number; lon: number }[] | null = null;
  for (let i = 0; i < pts.length - 1; i++) {
    const s = pts[i];
    const e = pts[i + 1];
    const mid = geo.scale(geo.add(s.p, e.p), 0.5);
    const len = geo.dist(s.p, e.p);
    const isExact = distanceToLine(s.p, lineB) <= TOLERANCE_M && distanceToLine(e.p, lineB) <= TOLERANCE_M && distanceToLine(mid, lineB) <= TOLERANCE_M;
    const isNear = isExact || (checkParallel && hasParallelCounterpart(s.p, e.p, lineB, signA, signB));
    if (isExact) {
      out.exact += len;
      if (!curExact) out.exactStretches.push((curExact = [{ lat: s.lat, lon: s.lon }]));
      curExact.push({ lat: e.lat, lon: e.lon });
    } else {
      curExact = null;
    }
    if (isNear) {
      out.near += len;
      if (!curNear) out.nearStretches.push((curNear = [{ lat: s.lat, lon: s.lon }]));
      curNear.push({ lat: e.lat, lon: e.lon });
    } else {
      curNear = null;
    }
  }
  return out;
}

// Looks for a shared node from which both ways head off in the same direction.
// Over the length of the shorter first segment the two must stay within FORK_SEPARATION_M
// of each other, i.e. one really does run on top of the other.
function forkOverlap(a: WayEntity, b: WayEntity, ptsA: { lat: number; lon: number; p: geo.Vec }[], ptsB: { lat: number; lon: number; p: geo.Vec }[]): { meters: number; stretch: { lat: number; lon: number }[] } | null {
  if (ptsA.length !== a.nodeIds.length || ptsB.length !== b.nodeIds.length) return null;
  const indexInB = new Map<number, number>();
  b.nodeIds.forEach((id, j) => indexInB.set(id, j));
  let best: { meters: number; stretch: { lat: number; lon: number }[] } | null = null;
  for (let i = 0; i < a.nodeIds.length; i++) {
    const j = indexInB.get(a.nodeIds[i]);
    if (j === undefined) continue;
    const n = ptsA[i];
    for (const da of [1, -1]) {
      for (const db of [1, -1]) {
        const ka = ptsA[i + da];
        const kb = ptsB[j + db];
        if (!ka || !kb) continue;
        if (directedDiff(n.p, ka.p, n.p, kb.p) > FORK_ANGLE_RAD) continue;
        const lenA = geo.dist(n.p, ka.p);
        const lenB = geo.dist(n.p, kb.p);
        const shared = Math.min(lenA, lenB);
        if (shared < MIN_FORK_OVERLAP_M) continue;
        const pa = geo.add(n.p, geo.scale(geo.sub(ka.p, n.p), shared / lenA));
        const pb = geo.add(n.p, geo.scale(geo.sub(kb.p, n.p), shared / lenB));
        if (geo.dist(pa, pb) > FORK_SEPARATION_M) continue;
        if (!best || shared > best.meters) best = { meters: shared, stretch: [{ lat: n.lat, lon: n.lon }, geo.unproject(pa)] };
      }
    }
  }
  return best;
}

export function findStackedWays(graph: Graph): StackedPair[] {
  const roads = graph.visibleWays().filter((w) => isRoad(w) && w.nodeIds.length >= 2);
  const lines = new Map<number, { lat: number; lon: number; p: geo.Vec }[]>();
  const items: Box[] = [];
  for (const way of roads) {
    const pts = graph.childNodes(way).map((n) => ({ lat: n.lat, lon: n.lon, p: geo.project(n.lat, n.lon) }));
    if (pts.length < 2) continue;
    lines.set(way.id, pts);
    items.push({
      minX: Math.min(...pts.map((q) => q.lon)),
      maxX: Math.max(...pts.map((q) => q.lon)),
      minY: Math.min(...pts.map((q) => q.lat)),
      maxY: Math.max(...pts.map((q) => q.lat)),
      way,
    });
  }
  const tree = new RBush<Box>();
  tree.load(items);

  const out: StackedPair[] = [];
  for (const item of items) {
    const a = item.way;
    const ptsA = lines.get(a.id)!;
    const candidates = tree.search({ minX: item.minX - BOX_PAD_DEG, maxX: item.maxX + BOX_PAD_DEG, minY: item.minY - BOX_PAD_DEG, maxY: item.maxY + BOX_PAD_DEG });
    for (const { way: b } of candidates) {
      if (b.id <= a.id || separatedVertically(a, b)) continue;
      const lineB = lines.get(b.id)!.map((q) => q.p);

      const checkParallel = !parallelIsLegitimate(a, b);
      // Coverage is not symmetric: a short way can lie entirely on one long
      // segment of the other while that segment's own ends are far away. So
      // measure each way against the other and keep the larger overlap.
      const lineA = ptsA.map((q) => q.p);
      const ab = coverage(ptsA, lineB, checkParallel, onewaySign(a), onewaySign(b));
      const ba = coverage(lines.get(b.id)!, lineA, checkParallel, onewaySign(b), onewaySign(a));
      const exact = Math.max(ab.exact, ba.exact);
      const exactStretches = ab.exact >= ba.exact ? ab.exactStretches : ba.exactStretches;
      const near = Math.max(ab.near, ba.near);
      const nearStretches = ab.near >= ba.near ? ab.nearStretches : ba.nearStretches;
      const fork = checkParallel && a.tags.highway === b.tags.highway ? forkOverlap(a, b, ptsA, lines.get(b.id)!) : null;
      if (exact >= MIN_OVERLAP_M) {
        out.push({ kind: "stacked", a, b, overlapMeters: exact, stretches: exactStretches, location: exactStretches[0][0] });
      } else if (fork) {
        out.push({ kind: "fork", a, b, overlapMeters: fork.meters, stretches: [fork.stretch], location: fork.stretch[0] });
      } else if (near >= MIN_PARALLEL_OVERLAP_M) {
        out.push({ kind: "parallel", a, b, overlapMeters: near, stretches: nearStretches, location: nearStretches[0][0] });
      }
    }
  }
  return out;
}
