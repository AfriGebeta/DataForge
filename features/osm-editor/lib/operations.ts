// Shape-editing operations — map-editor-full-spec.md §1.4 plus the iD
// operations the OSM website's embedded editor offers: move, rotate,
// reflect, straighten, orthogonalize (square corners), circularize,
// extract, merge (join lines), copy/paste. Like actions.ts these are
// pure (graph, ...) => graph functions; the interactive modes
// (TransformController.tsx) only decide *what* delta/angle to apply and
// call into here for every preview frame and the final commit.
//
// Operations that can legitimately be impossible for a given input
// (already straight, not squarish, can't be chained...) return null so
// the caller can disable the menu entry instead of silently no-op'ing.

import { deleteNode, deleteWay, createNode, createWay, mergeNodes } from "./actions";
import * as geo from "./geo";
import type { Graph, NodeEntity, OsmTags, WayEntity } from "./graph";
import { isClosedWay } from "./geometryRoles";

export interface SelectionRef {
  type: "node" | "way" | "relation";
  id: number;
}

// Every node a selection covers: selected nodes plus all vertices of
// selected ways. This is the set move/rotate/reflect transform.
export function nodeIdsOfSelection(graph: Graph, selection: SelectionRef[]): number[] {
  const ids = new Set<number>();
  for (const s of selection) {
    if (s.type === "node" && graph.node(s.id)) ids.add(s.id);
    if (s.type === "way") {
      const way = graph.way(s.id);
      if (way) for (const n of way.nodeIds) ids.add(n);
    }
  }
  return [...ids];
}

function mapNodes(graph: Graph, nodeIds: number[], fn: (p: geo.Vec, node: NodeEntity) => geo.Vec): Graph {
  let g = graph;
  for (const id of nodeIds) {
    const node = g.node(id);
    if (!node) continue;
    const next = fn(geo.project(node.lat, node.lon), node);
    const { lat, lon } = geo.unproject(next);
    g = g.replace({ ...node, lat, lon });
  }
  return g;
}

export function selectionCenter(graph: Graph, nodeIds: number[]): geo.Vec | null {
  const pts = nodeIds.map((id) => graph.node(id)).filter((n): n is NodeEntity => !!n).map((n) => geo.project(n.lat, n.lon));
  return pts.length === 0 ? null : geo.centroid(pts);
}

// ── move / rotate / reflect ────────────────────────────────────────

export function translateNodes(graph: Graph, nodeIds: number[], dx: number, dy: number): Graph {
  return mapNodes(graph, nodeIds, (p) => ({ x: p.x + dx, y: p.y + dy }));
}

export function rotateNodes(graph: Graph, nodeIds: number[], center: geo.Vec, angle: number): Graph {
  return mapNodes(graph, nodeIds, (p) => geo.rotateAround(p, center, angle));
}

// Reflect across the long or short axis of the selection's minimum-area
// bounding rectangle (iD's "Flip Long"/"Flip Short"). Needs >= 2 nodes
// that aren't all coincident.
export function reflectNodes(graph: Graph, nodeIds: number[], axis: "long" | "short"): Graph | null {
  const pts = nodeIds.map((id) => graph.node(id)).filter((n): n is NodeEntity => !!n).map((n) => geo.project(n.lat, n.lon));
  if (pts.length < 2) return null;
  const { center, long, short } = geo.orientedBoundingAxes(pts);
  const dir = axis === "long" ? long : short;
  return mapNodes(graph, nodeIds, (p) => geo.reflectAcross(p, center, dir));
}

// ── straighten ─────────────────────────────────────────────────────

function isRemovableVertex(graph: Graph, wayId: number, node: NodeEntity): boolean {
  if (Object.keys(node.tags).length > 0) return false;
  const parents = graph.parentWays(node.id);
  if (parents.length !== 1 || parents[0].id !== wayId) return false;
  return graph.parentRelations("node", node.id).length === 0;
}

// Interior vertices that are untagged and used only by this way are
// deleted outright (they were just shape points); the rest (junctions,
// tagged vertices) are slid onto the end-to-end line so connections
// survive. Same rule iD applies.
export function straightenWay(graph: Graph, wayId: number): Graph | null {
  const way = graph.way(wayId);
  if (!way || isClosedWay(way) || way.nodeIds.length < 3) return null;
  const first = graph.node(way.nodeIds[0]);
  const last = graph.node(way.nodeIds[way.nodeIds.length - 1]);
  if (!first || !last) return null;
  const a = geo.project(first.lat, first.lon);
  const b = geo.project(last.lat, last.lon);
  if (geo.dist(a, b) < 1e-6) return null;

  let g = graph;
  let changed = false;
  const interior = way.nodeIds.slice(1, -1);
  for (const id of interior) {
    const node = g.node(id);
    if (!node) continue;
    const p = geo.project(node.lat, node.lon);
    const onLine = geo.projectOnLine(p, a, b);
    if (geo.dist(p, onLine) < 0.01) continue; // already on the line (1 cm)
    changed = true;
    if (isRemovableVertex(g, wayId, node)) {
      const current = g.way(wayId)!;
      g = g.replace({ ...current, nodeIds: current.nodeIds.filter((n) => n !== id) });
      g = deleteNode(g, id);
    } else {
      const { lat, lon } = geo.unproject(onLine);
      g = g.replace({ ...node, lat, lon });
    }
  }
  return changed ? g : null;
}

// ── orthogonalize (square corners) ─────────────────────────────────

const ORTHO_THRESHOLD_DEG = 13; // corners within 13° of 90° (or of straight) are adjusted
const ORTHO_EPSILON = 1e-4;

function wrap(i: number, n: number): number {
  return (i + n) % n;
}

// Classifies a corner by the cosine of its angle: "square" if within the
// threshold of 90°, "straight" if within it of 180°, otherwise left alone.
function classifyCorner(cos: number): "square" | "straight" | null {
  const lower = Math.cos((90 - ORTHO_THRESHOLD_DEG) * (Math.PI / 180));
  const upper = Math.cos(ORTHO_THRESHOLD_DEG * (Math.PI / 180));
  const a = Math.abs(cos);
  if (a < lower) return "square";
  if (cos < -upper) return "straight";
  return null;
}

function orthoScore(pts: geo.Vec[], closed: boolean): number {
  let score = 0;
  for (let i = 0; i < pts.length; i++) {
    if (!closed && (i === 0 || i === pts.length - 1)) continue;
    const a = pts[wrap(i - 1, pts.length)];
    const b = pts[i];
    const c = pts[wrap(i + 1, pts.length)];
    const p = geo.normalize(geo.sub(a, b));
    const q = geo.normalize(geo.sub(c, b));
    const cos = geo.dot(p, q);
    const kind = classifyCorner(cos);
    if (kind === "square") score += Math.abs(cos);
    else if (kind === "straight") score += 1 + cos; // cos -> -1 when straight
  }
  return score;
}

function orthoMotion(pts: geo.Vec[], i: number, closed: boolean): geo.Vec {
  if (!closed && (i === 0 || i === pts.length - 1)) return { x: 0, y: 0 };
  const a = pts[wrap(i - 1, pts.length)];
  const b = pts[i];
  const c = pts[wrap(i + 1, pts.length)];
  const pv = geo.sub(a, b);
  const qv = geo.sub(c, b);
  const scaleLen = 2 * Math.min(geo.len(pv), geo.len(qv));
  const p = geo.normalize(pv);
  const q = geo.normalize(qv);
  const cos = geo.dot(p, q);
  const kind = classifyCorner(cos);
  if (kind === "square") {
    const bis = geo.normalize(geo.add(p, q));
    if (geo.len(bis) === 0) return { x: 0, y: 0 };
    return geo.scale(bis, 0.1 * cos * scaleLen);
  }
  if (kind === "straight") {
    // Pull the vertex toward the chord between its neighbours.
    const mid = geo.scale(geo.add(a, c), 0.5);
    return geo.scale(geo.sub(mid, b), 0.25);
  }
  return { x: 0, y: 0 };
}

export function canOrthogonalize(graph: Graph, wayId: number): boolean {
  const pts = orthoPoints(graph, wayId);
  if (!pts) return false;
  const score = orthoScore(pts.points, pts.closed);
  return score > ORTHO_EPSILON && hasSquarishCorner(pts.points, pts.closed);
}

function hasSquarishCorner(points: geo.Vec[], closed: boolean): boolean {
  for (let i = 0; i < points.length; i++) {
    if (!closed && (i === 0 || i === points.length - 1)) continue;
    const p = geo.normalize(geo.sub(points[wrap(i - 1, points.length)], points[i]));
    const q = geo.normalize(geo.sub(points[wrap(i + 1, points.length)], points[i]));
    if (classifyCorner(geo.dot(p, q))) return true;
  }
  return false;
}

function orthoPoints(graph: Graph, wayId: number): { ids: number[]; points: geo.Vec[]; closed: boolean } | null {
  const way = graph.way(wayId);
  if (!way) return null;
  const closed = isClosedWay(way);
  const ids = closed ? way.nodeIds.slice(0, -1) : way.nodeIds.slice();
  if (ids.length < 3) return null;
  const nodes = ids.map((id) => graph.node(id));
  if (nodes.some((n) => !n)) return null;
  return { ids, points: (nodes as NodeEntity[]).map((n) => geo.project(n.lat, n.lon)), closed };
}

// Corner count that is *nearly* square but not yet — used by validation
// ("unsquare way") with a tighter, user-visible tolerance.
export function unsquareCornerCount(graph: Graph, wayId: number, toleranceDeg = 5): number {
  const pts = orthoPoints(graph, wayId);
  if (!pts || !pts.closed) return 0;
  let n = 0;
  for (let i = 0; i < pts.points.length; i++) {
    const ang = geo.angleAt(pts.points[wrap(i - 1, pts.points.length)], pts.points[i], pts.points[wrap(i + 1, pts.points.length)]);
    const off = Math.abs(ang - 90);
    if (off > 0.5 && off <= toleranceDeg) n++;
  }
  return n;
}

export function orthogonalizeWay(graph: Graph, wayId: number): Graph | null {
  const pts = orthoPoints(graph, wayId);
  if (!pts || !hasSquarishCorner(pts.points, pts.closed)) return null;
  let points = pts.points.map((p) => ({ ...p }));
  let best = points;
  let bestScore = orthoScore(points, pts.closed);
  if (bestScore < ORTHO_EPSILON) return null;
  for (let iter = 0; iter < 1000 && bestScore >= ORTHO_EPSILON; iter++) {
    const motions = points.map((_, i) => orthoMotion(points, i, pts.closed));
    points = points.map((p, i) => geo.add(p, motions[i]));
    const s = orthoScore(points, pts.closed);
    if (s < bestScore) {
      bestScore = s;
      best = points.map((p) => ({ ...p }));
    }
  }
  let g = graph;
  pts.ids.forEach((id, i) => {
    const node = g.node(id);
    if (!node) return;
    const { lat, lon } = geo.unproject(best[i]);
    g = g.replace({ ...node, lat, lon });
  });
  return g;
}

// ── circularize ────────────────────────────────────────────────────

const CIRCLE_MAX_ANGLE = (20 * Math.PI) / 180;

export function circularizeWay(graph: Graph, wayId: number, allocateNodeId: () => number): Graph | null {
  const way = graph.way(wayId);
  if (!way || !isClosedWay(way)) return null;
  const ids = way.nodeIds.slice(0, -1);
  const nodes = ids.map((id) => graph.node(id));
  if (nodes.some((n) => !n) || ids.length < 3) return null;
  const pts = (nodes as NodeEntity[]).map((n) => geo.project(n.lat, n.lon));
  const center = geo.ringCentroid(pts);
  const radius = pts.reduce((sum, p) => sum + geo.dist(p, center), 0) / pts.length;
  if (radius < 0.01) return null;
  const dir = geo.signedArea(pts) >= 0 ? 1 : -1;
  const angles = pts.map((p) => Math.atan2(p.y - center.y, p.x - center.x));

  let g = graph;
  const outIds: number[] = [];
  const TWO_PI = Math.PI * 2;
  for (let i = 0; i < ids.length; i++) {
    const a = angles[i];
    const node = g.node(ids[i])!;
    const onCircle = { x: center.x + radius * Math.cos(a), y: center.y + radius * Math.sin(a) };
    const ll = geo.unproject(onCircle);
    g = g.replace({ ...node, lat: ll.lat, lon: ll.lon });
    outIds.push(ids[i]);

    const next = angles[(i + 1) % ids.length];
    let delta = dir * (next - a);
    delta = ((delta % TWO_PI) + TWO_PI) % TWO_PI;
    if (delta > CIRCLE_MAX_ANGLE) {
      const extra = Math.ceil(delta / CIRCLE_MAX_ANGLE) - 1;
      for (let j = 1; j <= extra; j++) {
        const ang = a + dir * ((delta * j) / (extra + 1));
        const p = { x: center.x + radius * Math.cos(ang), y: center.y + radius * Math.sin(ang) };
        const { lat, lon } = geo.unproject(p);
        const id = allocateNodeId();
        g = createNode(g, id, lat, lon, {});
        outIds.push(id);
      }
    }
  }
  return g.replace({ ...g.way(wayId)!, nodeIds: [...outIds, outIds[0]] });
}

// ── extract ────────────────────────────────────────────────────────

// Pulls a tagged vertex's tags off into a new standalone point at the
// same spot, leaving a plain shape vertex behind (iD "Extract"). By default
// the new point also joins the relations the vertex belonged to (e.g. a
// stop in a route); ⇧E in iD — `copyRelations: false` — leaves it out.
export function extractNode(graph: Graph, nodeId: number, allocateNodeId: () => number, opts: { copyRelations?: boolean } = {}): Graph | null {
  const node = graph.node(nodeId);
  if (!node || Object.keys(node.tags).length === 0 || graph.parentWays(nodeId).length === 0) return null;
  const id = allocateNodeId();
  let g = createNode(graph, id, node.lat, node.lon, node.tags);
  g = g.replace({ ...node, tags: {} });
  if (opts.copyRelations ?? true) {
    for (const rel of graph.parentRelations("node", nodeId)) {
      const members = rel.members.flatMap((m) => (m.type === "node" && m.ref === nodeId ? [m, { ...m, ref: id }] : [m]));
      g = g.replace({ ...g.relation(rel.id)!, members });
    }
  }
  return g;
}

// ── merge (join lines) ─────────────────────────────────────────────

function mergeTags(ways: WayEntity[]): OsmTags {
  const out: Record<string, string[]> = {};
  for (const w of ways) {
    for (const [k, v] of Object.entries(w.tags)) {
      const vals = (out[k] ??= []);
      for (const part of v.split(";")) if (!vals.includes(part)) vals.push(part);
    }
  }
  return Object.fromEntries(Object.entries(out).map(([k, vals]) => [k, vals.join(";")]));
}

// Chains open ways end-to-end into one. Returns null if they don't form
// a single chain (or a direction-sensitive way would need reversing).
export function joinWays(graph: Graph, wayIds: number[]): Graph | null {
  const r = joinWaysDetailed(graph, wayIds);
  return "graph" in r ? r.graph : null;
}

// Why the selected lines can't be merged, or null when they can.
export function joinProblem(graph: Graph, wayIds: number[]): string | null {
  const r = joinWaysDetailed(graph, wayIds);
  return "reason" in r ? r.reason : null;
}

// Marks a way produced by a forced merge; validation.ts turns it (and the
// bridged gaps) into red errors until the user fixes them and removes it.
export const MERGE_FIXME_PREFIX = "Merged roads:";

export interface ForcedJoin {
  graph: Graph;
  gaps: number;
  conflicts: number;
}

// Merge that never refuses: strict joins first, otherwise chains the
// lines by nearest endpoints, bridging gaps with a straight segment and
// flipping direction-sensitive lines, then tags the result with a fixme
// so every bridged gap / direction conflict shows up as an error.
export function joinWaysForced(graph: Graph, wayIds: number[]): ForcedJoin | { reason: string } {
  const strict = joinWaysDetailed(graph, wayIds);
  if ("graph" in strict) return { graph: strict.graph, gaps: 0, conflicts: 0 };
  const r = joinWaysDetailed(graph, wayIds, true);
  if ("graph" in r && r.stats) {
    const { gaps, conflicts, pairs } = r.stats;
    const keepId = r.keepId!;
    const keep = r.graph.way(keepId)!;
    const parts = [gaps ? `${gaps} gap${gaps > 1 ? "s" : ""} bridged` : "", conflicts ? `${conflicts} one-way conflict${conflicts > 1 ? "s" : ""}` : ""].filter(Boolean);
    return { graph: r.graph.replace({ ...keep, tags: { ...keep.tags, fixme: `${MERGE_FIXME_PREFIX} ${parts.join(", ")} — fix, then delete this tag${pairs.map(([a, b]) => ` [${a}>${b}]`).join("")}` } }), gaps, conflicts };
  }
  return "reason" in r ? r : { reason: "Select two or more open lines to merge." };
}

// Closes one bridged gap of a forced merge by sliding the whole part of
// the road on one side of it so its end lands on the other part's end,
// then welding the two end nodes. moveFirst = slide the part before the
// gap (up to node a) onto b; otherwise slide the part after it onto a.
// Shared nodes move too (like iD's Move), dragging connected roads' ends.
export function closeMergeGap(graph: Graph, wayId: number, a: number, b: number, moveFirst: boolean): Graph {
  const way = graph.way(wayId);
  const i = way ? way.nodeIds.findIndex((id, k) => (id === a && way.nodeIds[k + 1] === b) || (id === b && way.nodeIds[k + 1] === a)) : -1;
  if (!way || i < 0) return graph;
  const na = graph.node(way.nodeIds[i]);
  const nb = graph.node(way.nodeIds[i + 1]);
  if (!na || !nb) return graph;
  const part = moveFirst ? way.nodeIds.slice(0, i + 1) : way.nodeIds.slice(i + 1);
  const dLat = moveFirst ? nb.lat - na.lat : na.lat - nb.lat;
  const dLon = moveFirst ? nb.lon - na.lon : na.lon - nb.lon;
  let g = graph;
  for (const id of new Set(part)) {
    const n = g.node(id);
    if (n) g = g.replace({ ...n, lat: n.lat + dLat, lon: n.lon + dLon });
  }
  g = moveFirst ? mergeNodes(g, nb.id, na.id) : mergeNodes(g, na.id, nb.id);

  // Drop this gap from the fixme note; remove the note once nothing is left.
  const w = g.way(wayId);
  const fixme = w?.tags.fixme;
  if (w && fixme?.startsWith(MERGE_FIXME_PREFIX)) {
    const gaps = Number(fixme.match(/(\d+) gaps? bridged/)?.[1] ?? 1) - 1;
    const conflicts = Number(fixme.match(/(\d+) one-way conflicts?/)?.[1] ?? 0);
    const pairs = [...fixme.matchAll(/\[(-?\d+)>(-?\d+)\]/g)].map((m) => [Number(m[1]), Number(m[2])]).filter(([x, y]) => !((x === a && y === b) || (x === b && y === a)));
    const { fixme: _drop, ...rest } = w.tags;
    void _drop;
    if (gaps <= 0 && conflicts === 0) {
      g = g.replace({ ...w, tags: rest });
    } else {
      const parts = [gaps > 0 ? `${gaps} gap${gaps > 1 ? "s" : ""} bridged` : "", conflicts ? `${conflicts} one-way conflict${conflicts > 1 ? "s" : ""}` : ""].filter(Boolean);
      g = g.replace({ ...w, tags: { ...rest, fixme: `${MERGE_FIXME_PREFIX} ${parts.join(", ")} — fix, then delete this tag${pairs.map(([x, y]) => ` [${x}>${y}]`).join("")}` } });
    }
  }
  return g;
}

function joinWaysDetailed(graph: Graph, wayIds: number[], force = false): { graph: Graph; stats?: { gaps: number; conflicts: number; pairs: [number, number][] }; keepId?: number } | { reason: string } {
  const ways = wayIds.map((id) => graph.way(id)).filter((w): w is WayEntity => !!w);
  if (ways.length < 2 || ways.length !== wayIds.length) return { reason: "Select two or more lines to merge." };
  if (ways.some(isClosedWay)) return { reason: "Closed rings can't be joined — select open lines." };

  const directional = (w: WayEntity) => !!w.tags.oneway && w.tags.oneway !== "no";
  let chain = ways[0].nodeIds.slice();
  const remaining = ways.slice(1);
  let gaps = 0;
  let conflicts = 0;
  const pairs: [number, number][] = [];
  const at = (id: number) => graph.node(id);
  const gapTo = (a: number, b: number) => {
    const na = at(a);
    const nb = at(b);
    return na && nb ? geo.meters(na.lat, na.lon, nb.lat, nb.lon) : Infinity;
  };
  while (remaining.length > 0) {
    const head = chain[0];
    const tail = chain[chain.length - 1];
    const idx = remaining.findIndex((w) => {
      const f = w.nodeIds[0];
      const l = w.nodeIds[w.nodeIds.length - 1];
      return f === tail || l === tail || f === head || l === head;
    });
    if (idx === -1 && force) {
      // Nearest endpoint of any remaining line to either chain end.
      let best = { d: Infinity, i: 0, atTail: true, flip: false };
      remaining.forEach((w, i) => {
        const f = w.nodeIds[0];
        const l = w.nodeIds[w.nodeIds.length - 1];
        for (const [end, atTail] of [[chain[chain.length - 1], true], [chain[0], false]] as const) {
          // atTail: w must start at the chain tail (else flip); !atTail: w must end at the head.
          const dF = gapTo(end, f);
          const dL = gapTo(end, l);
          if (dF < best.d) best = { d: dF, i, atTail, flip: !atTail };
          if (dL < best.d) best = { d: dL, i, atTail, flip: atTail };
        }
      });
      const w = remaining.splice(best.i, 1)[0];
      let nodes = w.nodeIds.slice();
      if (best.flip) {
        nodes = nodes.reverse();
        if (directional(w)) conflicts++;
      }
      gaps++;
      pairs.push(best.atTail ? [chain[chain.length - 1], nodes[0]] : [nodes[nodes.length - 1], chain[0]]);
      chain = best.atTail ? chain.concat(nodes) : nodes.concat(chain);
      continue;
    }
    if (idx === -1) {
      const touchesMidway = remaining.some((w) => w.nodeIds.some((n) => chain.includes(n)) || chain.some((n) => w.nodeIds.includes(n)));
      return {
        reason: touchesMidway
          ? "These lines only meet in the middle of a line, not end to end. Split one with X at the shared node first."
          : "These lines don't share an end node. Drag the end of one onto the end of the other (or select both end nodes and press C) so they connect, then merge.",
      };
    }
    const w = remaining.splice(idx, 1)[0];
    const f = w.nodeIds[0];
    const l = w.nodeIds[w.nodeIds.length - 1];
    const opposed = { reason: "Their one-way directions point against each other. Reverse one with V, then merge." };
    if (f === tail) {
      chain = chain.concat(w.nodeIds.slice(1));
    } else if (l === tail) {
      if (directional(w)) return opposed;
      chain = chain.concat(w.nodeIds.slice(0, -1).reverse());
    } else if (l === head) {
      chain = w.nodeIds.slice(0, -1).concat(chain);
    } else {
      if (directional(w)) return opposed;
      chain = w.nodeIds.slice(1).reverse().concat(chain);
    }
  }

  // Keep the oldest persisted way so history/ids stay stable.
  const keep = ways.filter((w) => w.id > 0).sort((a, b) => a.id - b.id)[0] ?? ways[0];
  const others = ways.filter((w) => w.id !== keep.id);

  let g = graph.replace({ ...keep, nodeIds: chain, tags: mergeTags(ways) });
  for (const other of others) {
    for (const rel of g.parentRelations("way", other.id)) {
      const hasKeep = rel.members.some((m) => m.type === "way" && m.ref === keep.id);
      const members = rel.members.flatMap((m) => {
        if (!(m.type === "way" && m.ref === other.id)) return [m];
        return hasKeep ? [] : [{ ...m, ref: keep.id }];
      });
      g = g.replace({ ...rel, members });
    }
    g = deleteWay(g, other.id);
  }
  return { graph: g, stats: { gaps, conflicts, pairs }, keepId: keep.id };
}

export function canJoinWays(graph: Graph, wayIds: number[]): boolean {
  return joinWays(graph, wayIds) !== null;
}

// ── copy / paste ───────────────────────────────────────────────────

export interface Clipboard {
  nodes: NodeEntity[];
  ways: WayEntity[];
  center: geo.Vec;
}

export function copyFeatures(graph: Graph, selection: SelectionRef[]): Clipboard | null {
  const wayIds = selection.filter((s) => s.type === "way").map((s) => s.id);
  const nodeIds = new Set<number>(selection.filter((s) => s.type === "node").map((s) => s.id));
  const ways: WayEntity[] = [];
  for (const id of wayIds) {
    const w = graph.way(id);
    if (!w) continue;
    ways.push(w);
    w.nodeIds.forEach((n) => nodeIds.add(n));
  }
  const nodes = [...nodeIds].map((id) => graph.node(id)).filter((n): n is NodeEntity => !!n);
  if (nodes.length === 0) return null;
  const center = geo.centroid(nodes.map((n) => geo.project(n.lat, n.lon)));
  return { nodes, ways, center };
}

// Pastes the clipboard centered on (lat, lon) as brand-new entities
// (fresh negative ids, version 0, no relation memberships). Returns the
// new selection so the caller can immediately select what was pasted.
export function pasteFeatures(
  graph: Graph,
  clip: Clipboard,
  lat: number,
  lon: number,
  allocate: (type: "node" | "way") => number,
): { graph: Graph; created: SelectionRef[] } {
  const target = geo.project(lat, lon);
  const idMap = new Map<number, number>();
  let g = graph;
  for (const n of clip.nodes) {
    const id = allocate("node");
    idMap.set(n.id, id);
    const p = geo.add(target, geo.sub(geo.project(n.lat, n.lon), clip.center));
    const ll = geo.unproject(p);
    g = createNode(g, id, ll.lat, ll.lon, n.tags);
  }
  const created: SelectionRef[] = [];
  const inWay = new Set<number>();
  for (const w of clip.ways) {
    const id = allocate("way");
    const nodeIds = w.nodeIds.map((n) => idMap.get(n)).filter((n): n is number => n !== undefined);
    nodeIds.forEach((n) => inWay.add(n));
    g = createWay(g, id, nodeIds, w.tags);
    created.push({ type: "way", id });
  }
  for (const n of clip.nodes) {
    const id = idMap.get(n.id)!;
    if (!inWay.has(id)) created.push({ type: "node", id });
  }
  return { graph: g, created };
}

// ── continue (extend a line from its end) ──────────────────────────

// The one open line `nodeId` is an end of, or null if it isn't the end of
// exactly one open line (iD only offers Continue when it's unambiguous).
export function continuableWay(graph: Graph, nodeId: number): WayEntity | null {
  const node = graph.node(nodeId);
  if (!node) return null;
  const ends = graph.parentWays(nodeId).filter((w) => !isClosedWay(w) && (w.nodeIds[0] === nodeId || w.nodeIds[w.nodeIds.length - 1] === nodeId));
  return ends.length === 1 ? ends[0] : null;
}

// Appends (or, when continuing from the way's first node, prepends in
// reverse) already-created node ids onto an existing line — the commit
// half of Continue; the draw session supplies the new points.
export function extendWay(graph: Graph, wayId: number, fromNodeId: number, newNodeIds: number[]): Graph | null {
  const way = graph.way(wayId);
  if (!way || newNodeIds.length === 0) return null;
  const last = way.nodeIds[way.nodeIds.length - 1];
  if (last === fromNodeId) return graph.replace({ ...way, nodeIds: [...way.nodeIds, ...newNodeIds] });
  if (way.nodeIds[0] === fromNodeId) return graph.replace({ ...way, nodeIds: [...newNodeIds.slice().reverse(), ...way.nodeIds] });
  return null;
}

// ── downgrade ──────────────────────────────────────────────────────

const KEEP_ADDRESS = (k: string) => k.startsWith("addr:");
const KEEP_BUILDING = (k: string) => k === "building" || k.startsWith("building:") || k === "height" || k.startsWith("roof:") || KEEP_ADDRESS(k);

// What a downgrade keeps: a building keeps building/address detail and
// drops the business/amenity tags on top ("Downgrade to a building");
// anything else with an address keeps just the address ("to an address").
// Entities with neither a building nor an address can't be downgraded
// (iD's rule) — there'd be nothing left worth keeping.
export function downgradedTags(tags: OsmTags): OsmTags | null {
  const keys = Object.keys(tags);
  const keep = tags.building && tags.building !== "no" ? KEEP_BUILDING : keys.some(KEEP_ADDRESS) ? KEEP_ADDRESS : null;
  if (!keep) return null;
  const next: OsmTags = {};
  for (const k of keys) if (keep(k)) next[k] = tags[k];
  return Object.keys(next).length === keys.length ? null : next;
}

export function downgradeSelection(graph: Graph, selection: SelectionRef[]): Graph | null {
  let g = graph;
  let changed = false;
  for (const s of selection) {
    const e = g.get(s.type, s.id);
    if (!e) continue;
    const next = downgradedTags(e.tags);
    if (!next) continue;
    g = g.replace({ ...e, tags: next });
    changed = true;
  }
  return changed ? g : null;
}

// ── merge polygons into a multipolygon ─────────────────────────────

function ringOf(graph: Graph, way: WayEntity): geo.Vec[] | null {
  if (!isClosedWay(way)) return null;
  const nodes = way.nodeIds.slice(0, -1).map((id) => graph.node(id));
  if (nodes.some((n) => !n)) return null;
  return (nodes as NodeEntity[]).map((n) => geo.project(n.lat, n.lon));
}

// Combines closed ways into one multipolygon relation: rings not inside
// any other become "outer", rings inside exactly one outer become "inner"
// (a hole). The outers' shared tags move onto the relation (iD does the
// same), leaving the member ways untagged. Returns null when the
// selection can't be merged unambiguously: not all closed, already in a
// relation, crossing/overlapping rings, holes nested deeper than one
// level, or outers whose tags disagree.
export function mergePolygons(graph: Graph, wayIds: number[], allocateRelationId: () => number): Graph | null {
  const ways = wayIds.map((id) => graph.way(id)).filter((w): w is WayEntity => !!w);
  if (ways.length < 2 || ways.length !== wayIds.length) return null;
  const rings = ways.map((w) => ringOf(graph, w));
  if (rings.some((r) => r === null)) return null;
  if (ways.some((w) => graph.parentRelations("way", w.id).length > 0)) return null;

  // Reject overlapping outlines: any two rings whose edges cross.
  for (let a = 0; a < rings.length; a++) {
    for (let b = a + 1; b < rings.length; b++) {
      const ra = rings[a]!;
      const rb = rings[b]!;
      for (let i = 0; i < ra.length; i++) {
        for (let j = 0; j < rb.length; j++) {
          if (geo.segmentIntersection(ra[i], ra[(i + 1) % ra.length], rb[j], rb[(j + 1) % rb.length])) return null;
        }
      }
    }
  }

  const containers = rings.map((r, i) => rings.reduce((n, other, j) => (j !== i && geo.pointInRing(r![0], other!) ? n + 1 : n), 0));
  if (containers.some((n) => n > 1)) return null; // islands inside holes: not supported
  const outerIdx = ways.map((_, i) => i).filter((i) => containers[i] === 0);
  const innerIdx = ways.map((_, i) => i).filter((i) => containers[i] === 1);
  if (outerIdx.length === 0) return null;

  // Outer tags must agree wherever more than one outer carries tags.
  const tagged = outerIdx.map((i) => ways[i].tags).filter((t) => Object.keys(t).length > 0);
  const moved = tagged[0] ?? {};
  if (tagged.some((t) => Object.keys(t).length !== Object.keys(moved).length || Object.keys(t).some((k) => t[k] !== moved[k]))) return null;

  const relId = allocateRelationId();
  const members = [...outerIdx.map((i) => ({ type: "way" as const, ref: ways[i].id, role: "outer" })), ...innerIdx.map((i) => ({ type: "way" as const, ref: ways[i].id, role: "inner" }))];
  let g = graph.replace({ type: "relation", id: relId, version: 0, visible: true, members, tags: { ...moved, type: "multipolygon" } });
  for (const i of outerIdx) g = g.replace({ ...g.way(ways[i].id)!, tags: {} });
  return g;
}

export function canMergePolygons(graph: Graph, wayIds: number[]): boolean {
  return mergePolygons(graph, wayIds, () => -1) !== null;
}

// ── nudge / scale (Shift+arrows, Shift +/-) ────────────────────────

// Moves nodes by a screen-pixel delta at the given zoom — iD's Shift+arrow
// nudge (10 px, Alt: 100 px). Screen y grows downward, Mercator y upward.
export function nudgeNodes(graph: Graph, nodeIds: number[], dxPx: number, dyPx: number, zoom: number): Graph {
  const metersPerPx = 156543.03392 / Math.pow(2, zoom); // Web-Mercator meters per pixel
  return translateNodes(graph, nodeIds, dxPx * metersPerPx, -dyPx * metersPerPx);
}

// Uniform scale about the selection's center (iD: Shift +/- = x1.05,
// Alt = x1.05^5). Needs at least two distinct nodes to mean anything.
export function scaleNodes(graph: Graph, nodeIds: number[], factor: number): Graph | null {
  if (nodeIds.length < 2 || !Number.isFinite(factor) || factor <= 0) return null;
  const center = selectionCenter(graph, nodeIds);
  if (!center) return null;
  return mapNodes(graph, nodeIds, (p) => geo.add(center, geo.scale(geo.sub(p, center), factor)));
}
