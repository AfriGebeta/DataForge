// Validation engine — map-editor-full-spec.md §1.10's save-review gate
// ("errors block the upload, warnings are shown but don't") and the
// Issues panel, modeled on iD's validator rule set: geometry problems
// (crossing ways, unclosed areas, near-duplicate nodes, almost-junctions,
// unsquare buildings, disconnected new roads), tag problems (missing
// tags, outdated tags, missing member roles) and hard API limits that
// the backend would reject anyway (way length, tag length).
//
// Rules run against a *scope*: the set of entities touched by the
// pending edit (the default — "my edits"), or everything loaded. Each
// issue may carry one-click fixes (pure graph => graph).

import type { Graph, NodeEntity, WayEntity } from "./graph";
import { entityKey } from "./graph";
import type { EntityType } from "./graph";
import type { GraphDiff } from "./diff";
import { matchPreset } from "./presets";
import RBush from "rbush";
import type { BBox } from "rbush";
import * as geo from "./geo";
import * as actions from "./actions";
import { normalizeEthiopianPhone, normalizeUrl, openingHoursProblem } from "./fields";
import { orthogonalizeWay, unsquareCornerCount, closeMergeGap, MERGE_FIXME_PREFIX } from "./operations";
import { isClosedWay } from "./geometryRoles";
import { findStackedWays } from "./stackedWays";

export type ValidationSeverity = "error" | "warning";

export interface EntityRef {
  type: EntityType;
  id: number;
}

export interface FixContext {
  allocateId: (type: EntityType) => number;
}

export interface IssueFix {
  label: string;
  apply: (graph: Graph, ctx: FixContext) => Graph;
}

export interface ValidationIssue {
  id: string;
  rule: string;
  severity: ValidationSeverity;
  message: string;
  // Primary entity — what SaveReviewModal prints and what the panel
  // selects/zooms to.
  entity: EntityRef;
  entities: EntityRef[];
  location?: { lat: number; lon: number };
  // The exact stretch to paint red when the issue is about one segment.
  segment?: [[number, number], [number, number]];
  fixes?: IssueFix[];
}

// Hard limits the PlaceForge OSM API enforces (repository/model.go).
const MAX_WAY_NODES = 2000;
const MAX_TAG_LENGTH = 255;
const MAX_RELATION_MEMBERS = 32000;

type Scope = Set<string> | "all";

function inScope(scope: Scope, type: EntityType, id: number): boolean {
  return scope === "all" || scope.has(entityKey(type, id));
}

export function scopeFromDiff(diff: GraphDiff): Set<string> {
  const s = new Set<string>();
  for (const n of [...diff.createdNodes, ...diff.modifiedNodes]) s.add(entityKey("node", n.id));
  for (const w of [...diff.createdWays, ...diff.modifiedWays]) s.add(entityKey("way", w.id));
  for (const r of [...diff.createdRelations, ...diff.modifiedRelations]) s.add(entityKey("relation", r.id));
  return s;
}

export function validateDiff(graph: Graph, diff: GraphDiff, base?: Graph): ValidationIssue[] {
  return validateGraph(graph, scopeFromDiff(diff), base);
}

// ── tag classification ─────────────────────────────────────────────

const AREA_NATURAL = new Set(["water", "wood", "scrub", "wetland", "grassland", "heath", "sand", "bare_rock", "beach", "glacier", "mud"]);

function impliesArea(tags: Record<string, string>): boolean {
  if (tags.area === "yes") return true;
  if (tags.building && tags.building !== "no") return true;
  if (tags.landuse) return true;
  if (tags.natural && AREA_NATURAL.has(tags.natural)) return true;
  return false;
}

type LinearClass = "highway" | "railway" | "waterway" | "building";

function linearClass(way: WayEntity, closed: boolean): LinearClass | null {
  const t = way.tags;
  if (t.building && t.building !== "no" && closed) return "building";
  if (t.highway && t.area !== "yes" && !closed) return "highway";
  if (t.highway && t.area !== "yes" && closed && t.highway !== "pedestrian") return "highway";
  if (t.railway && ["rail", "light_rail", "tram", "subway", "narrow_gauge", "monorail", "funicular"].includes(t.railway)) return "railway";
  if (t.waterway && ["river", "stream", "canal", "drain", "ditch"].includes(t.waterway)) return "waterway";
  return null;
}

function levelOf(way: WayEntity): number {
  const n = Number(way.tags.layer ?? "0");
  return Number.isFinite(n) ? n : 0;
}

function isSeparatedVertically(a: WayEntity, b: WayEntity): boolean {
  const passes = (w: WayEntity) => !!(w.tags.bridge && w.tags.bridge !== "no") || !!(w.tags.tunnel && w.tags.tunnel !== "no") || w.tags.covered === "yes" || !!w.tags.culvert;
  return passes(a) || passes(b) || levelOf(a) !== levelOf(b) || a.tags.ford === "yes" || b.tags.ford === "yes";
}

function crossingAllowed(a: LinearClass, b: LinearClass, wa: WayEntity, wb: WayEntity): boolean {
  if (isSeparatedVertically(wa, wb)) return true;
  const pair = [a, b].sort().join("+");
  // building+building and building+highway overlap/cross; everything else
  // among highway/railway/waterway is a crossing needing a junction or a
  // bridge/tunnel. building+railway/waterway are not checked.
  return !["building+building", "building+highway", "highway+highway", "highway+railway", "highway+waterway", "railway+railway", "railway+waterway", "waterway+waterway"].includes(pair);
}

// ── one-way helpers ────────────────────────────────────────────────

const CAR_ROADS = new Set(["motorway", "trunk", "primary", "secondary", "tertiary", "unclassified", "residential", "service", "living_street", "motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link"]);

// Where traffic on a one-way road starts and ends, honoring oneway=-1.
function onewayEnds(way: WayEntity): { start: number; end: number } | null {
  const v = way.tags.oneway;
  if (v !== "yes" && v !== "-1" && v !== "true" && v !== "1") return null;
  const first = way.nodeIds[0];
  const last = way.nodeIds[way.nodeIds.length - 1];
  return v === "-1" ? { start: last, end: first } : { start: first, end: last };
}

// ── mutually exclusive tags / private data / help requests ─────────

// iD's list (osm/tags.js): a "no…" flag next to the thing it denies.
const EXCLUSIVE_PAIRS: [string, string][] = [
  ["noname", "name"],
  ["noref", "ref"],
  ["nohousenumber", "addr:housenumber"],
  ["noaddress", "addr:housenumber"],
  ["noaddress", "addr:housename"],
  ["noaddress", "addr:unit"],
  ["addr:nostreet", "addr:street"],
];

// Buildings that are probably someone's home, so personal contact details
// on them are probably private — unless a "public" key says otherwise.
const PRIVATE_BUILDINGS = new Set(["detached", "farm", "house", "houseboat", "residential", "semidetached_house", "static_caravan"]);
const PUBLIC_KEYS = ["amenity", "craft", "historic", "leisure", "office", "shop", "tourism"];
const PERSONAL_TAGS = ["contact:email", "contact:fax", "contact:phone", "email", "fax", "phone"];

function exclusiveConflicts(tags: Record<string, string>): [string, string, "default" | "same_value"][] {
  const out: [string, string, "default" | "same_value"][] = [];
  for (const [a, b] of EXCLUSIVE_PAIRS) {
    if (!(a in tags) || !(b in tags)) continue;
    // noname=no is a double negative ("it does have a name"), not a conflict.
    if (/^(addr:)?no[a-z]/.test(a) && tags[a] === "no") continue;
    out.push([a, b, "default"]);
  }
  for (const key of Object.keys(tags)) {
    const negative = `not:${key}`;
    if (negative in tags && tags[negative].split(";").includes(tags[key])) out.push([negative, key, "same_value"]);
    if (/^name:[a-z]+/.test(key) && "not:name" in tags && tags["not:name"].split(";").includes(tags[key])) out.push(["not:name", key, "same_value"]);
  }
  return out;
}

// ── generic / suspicious names ─────────────────────────────────────

const GENERIC_NAMES = new Set(["unknown", "n/a", "na", "none", "no name", "noname", "test", "untitled", "unnamed", "name", "-", "?", "tbd", "todo"]);

function suspiciousName(tags: Record<string, string>, presetName: string | null): boolean {
  const name = tags.name?.trim().toLowerCase();
  if (!name) return false;
  if (GENERIC_NAMES.has(name)) return true;
  const generic = new Set<string>();
  if (presetName) generic.add(presetName.toLowerCase());
  for (const k of ["amenity", "shop", "tourism", "leisure", "building", "highway", "landuse", "natural"]) {
    const v = tags[k];
    if (v && v !== "yes") generic.add(v.replace(/_/g, " ").toLowerCase());
  }
  return generic.has(name);
}

// ── outdated tags ──────────────────────────────────────────────────

interface Deprecation {
  old: [string, string];
  replace: Record<string, string>;
}

// A curated subset of iD's deprecated-tag list (not the full file).
const DEPRECATED: Deprecation[] = [
  { old: ["highway", "ford"], replace: { ford: "yes" } },
  { old: ["highway", "unsurfaced"], replace: { highway: "track" } },
  { old: ["amenity", "swimming_pool"], replace: { leisure: "swimming_pool" } },
  { old: ["amenity", "public_building"], replace: { building: "public" } },
  { old: ["amenity", "emergency_phone"], replace: { emergency: "phone" } },
  { old: ["amenity", "fire_hydrant"], replace: { emergency: "fire_hydrant" } },
  { old: ["amenity", "sauna"], replace: { leisure: "sauna" } },
  { old: ["leisure", "hackerspace"], replace: { amenity: "hackerspace" } },
  { old: ["landuse", "farm"], replace: { landuse: "farmland" } },
  { old: ["natural", "marsh"], replace: { natural: "wetland", wetland: "marsh" } },
  { old: ["shop", "fishmonger"], replace: { shop: "seafood" } },
  { old: ["building", "true"], replace: { building: "yes" } },
  { old: ["building", "1"], replace: { building: "yes" } },
];

function upgradedTags(tags: Record<string, string>): Record<string, string> | null {
  let next = { ...tags };
  let changed = false;
  for (const [k, v] of Object.entries(next)) {
    const trimmed = v.trim().replace(/\s{2,}/g, " ");
    if (trimmed === "") {
      delete next[k];
      changed = true;
    } else if (trimmed !== v) {
      next[k] = trimmed;
      changed = true;
    }
  }
  for (const d of DEPRECATED) {
    if (next[d.old[0]] === d.old[1]) {
      delete next[d.old[0]];
      next = { ...next, ...d.replace };
      changed = true;
    }
  }
  return changed ? next : null;
}

// Deletes a way plus the nodes that only it used (untagged, in no other way
// or relation), so the fix doesn't leave stray points behind.
function removeWayAndOrphans(graph: Graph, wayId: number): Graph {
  const way = graph.way(wayId);
  if (!way) return graph;
  const nodeIds = [...new Set(way.nodeIds)];
  let g = actions.deleteWay(graph, wayId);
  for (const id of nodeIds) {
    const node = g.node(id);
    if (node && Object.keys(node.tags).length === 0 && g.parentWays(id).length === 0 && g.parentRelations("node", id).length === 0) {
      g = actions.deleteNode(g, id);
    }
  }
  return g;
}

// ── spatial helpers ────────────────────────────────────────────────

interface WayBox extends BBox {
  way: WayEntity;
}

function wayBoxes(graph: Graph): RBush<WayBox> {
  const tree = new RBush<WayBox>();
  const items: WayBox[] = [];
  for (const way of graph.visibleWays()) {
    const nodes = graph.childNodes(way);
    if (nodes.length < 2) continue;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const n of nodes) {
      minX = Math.min(minX, n.lon);
      maxX = Math.max(maxX, n.lon);
      minY = Math.min(minY, n.lat);
      maxY = Math.max(maxY, n.lat);
    }
    items.push({ minX, minY, maxX, maxY, way });
  }
  tree.load(items);
  return tree;
}

function pointsOf(graph: Graph, way: WayEntity): { node: NodeEntity; p: geo.Vec }[] {
  return graph.childNodes(way).map((node) => ({ node, p: geo.project(node.lat, node.lon) }));
}

// ── the rule runner ────────────────────────────────────────────────

// `base` is the last-saved graph; the help-request rule needs it to tell a
// `fixme` someone else left from one you just typed.
export function validateGraph(graph: Graph, scope: Scope, base?: Graph): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();
  function push(issue: Omit<ValidationIssue, "id">, discriminator = "") {
    const id = `${issue.rule}:${issue.entities.map((e) => entityKey(e.type, e.id)).join(",")}${discriminator}`;
    if (seen.has(id)) return;
    seen.add(id);
    issues.push({ ...issue, id });
  }

  const scopedWays = graph.visibleWays().filter((w) => inScope(scope, "way", w.id));
  const scopedNodes = graph.visibleNodes().filter((n) => inScope(scope, "node", n.id));
  const scopedRelations = graph.visibleRelations().filter((r) => inScope(scope, "relation", r.id));

  // ── per-way structural rules ─────────────────────────────────────
  for (const way of scopedWays) {
    const ref = { type: "way" as const, id: way.id };
    const first = graph.node(way.nodeIds[0]);
    const loc = first ? { lat: first.lat, lon: first.lon } : undefined;

    // Forced merge leftovers: the whole way is flagged, and each bridged
    // gap (a long segment) gets its own pin at its midpoint.
    if (way.tags.fixme?.startsWith(MERGE_FIXME_PREFIX)) {
      push({ rule: "merged_roads", severity: "error", message: way.tags.fixme, entity: ref, entities: [ref], location: loc });
      const fixme = way.tags.fixme;
      const bridged = new Set([...fixme.matchAll(/\[(-?\d+)>(-?\d+)\]/g)].map((m) => `${m[1]}>${m[2]}`));
      const expected = Number(fixme.match(/(\d+) gaps? bridged/)?.[1] ?? 0);
      const segs = way.nodeIds.slice(0, -1).map((id, i) => ({ i, a: graph.node(id), b: graph.node(way.nodeIds[i + 1]) }));
      let flagged = segs.filter((s) => bridged.has(`${way.nodeIds[s.i]}>${way.nodeIds[s.i + 1]}`) || bridged.has(`${way.nodeIds[s.i + 1]}>${way.nodeIds[s.i]}`));
      // Older merges carry no node ids: fall back to the longest segments.
      if (flagged.length === 0 && expected > 0) {
        flagged = segs
          .filter((s) => s.a && s.b)
          .sort((x, y) => geo.meters(y.a!.lat, y.a!.lon, y.b!.lat, y.b!.lon) - geo.meters(x.a!.lat, x.a!.lon, x.b!.lat, x.b!.lon))
          .slice(0, expected);
      }
      for (const { i, a, b } of flagged) {
        if (!a || !b) continue;
        const d = geo.meters(a.lat, a.lon, b.lat, b.lon);
        push(
          { rule: "merged_gap", severity: "error", message: `Gap of ${Math.round(d)} m bridged by merge — connect it properly or split the road here.`, entity: ref, entities: [ref], location: { lat: (a.lat + b.lat) / 2, lon: (a.lon + b.lon) / 2 }, segment: [[a.lat, a.lon], [b.lat, b.lon]], fixes: [{ label: "Slide the start part to meet the end part", apply: (g) => closeMergeGap(g, way.id, a.id, b.id, true) }, { label: "Slide the end part to meet the start part", apply: (g) => closeMergeGap(g, way.id, a.id, b.id, false) }] },
          `@${i}`,
        );
      }
    }

    for (let i = 0; i < way.nodeIds.length - 1; i++) {
      if (way.nodeIds[i] === way.nodeIds[i + 1]) {
        const dupAt = i + 1;
        push({
          rule: "zero_length",
          severity: "error",
          message: "Line has a zero-length segment (the same point twice in a row).",
          entity: ref,
          entities: [ref],
          location: loc,
          fixes: [
            {
              label: "Remove the duplicate node",
              apply: (g) => {
                const w = g.way(way.id);
                if (!w || w.nodeIds[dupAt] !== w.nodeIds[dupAt - 1]) return g;
                return actions.removeVertexFromWay(g, way.id, dupAt);
              },
            },
          ],
        });
        break;
      }
    }

    if (way.nodeIds.length > MAX_WAY_NODES) {
      push({ rule: "way_too_long", severity: "error", message: `Line has ${way.nodeIds.length} nodes; the API allows at most ${MAX_WAY_NODES}. Split it.`, entity: ref, entities: [ref], location: loc });
    }

    const closed = isClosedWay(way);
    if (impliesArea(way.tags) && !closed && way.nodeIds.length >= 3) {
      push({
        rule: "unclosed_area",
        severity: "error",
        message: `This is tagged as an area (${way.tags.building ? "building" : way.tags.landuse ? "landuse" : "area"}) but its outline isn't closed.`,
        entity: ref,
        entities: [ref],
        location: loc,
        fixes: [
          {
            label: "Close the outline",
            apply: (g) => {
              const w = g.way(way.id);
              return w ? g.replace({ ...w, nodeIds: [...w.nodeIds, w.nodeIds[0]] }) : g;
            },
          },
        ],
      });
    }

    const isMember = graph.parentRelations("way", way.id).length > 0;
    if (Object.keys(way.tags).length === 0 && !isMember) {
      push({ rule: "missing_tag", severity: "warning", message: "This line has no tags — say what it is.", entity: ref, entities: [ref], location: loc });
    }

    if (closed && way.tags.building && unsquareCornerCount(graph, way.id) > 0) {
      push({
        rule: "unsquare_way",
        severity: "warning",
        message: "This building has corners that are almost, but not quite, square.",
        entity: ref,
        entities: [ref],
        location: loc,
        fixes: [{ label: "Square the corners", apply: (g) => orthogonalizeWay(g, way.id) ?? g }],
      });
    }
  }

  // ── tags on every kind of scoped entity ──────────────────────────
  const tagged: { ref: EntityRef; tags: Record<string, string>; loc?: { lat: number; lon: number } }[] = [
    ...scopedNodes.map((n) => ({ ref: { type: "node" as const, id: n.id }, tags: n.tags, loc: { lat: n.lat, lon: n.lon } })),
    ...scopedWays.map((w) => {
      const f = graph.node(w.nodeIds[0]);
      return { ref: { type: "way" as const, id: w.id }, tags: w.tags, loc: f ? { lat: f.lat, lon: f.lon } : undefined };
    }),
    ...scopedRelations.map((r) => ({ ref: { type: "relation" as const, id: r.id }, tags: r.tags })),
  ];
  for (const t of tagged) {
    for (const [k, v] of Object.entries(t.tags)) {
      if ([...k].length > MAX_TAG_LENGTH || [...v].length > MAX_TAG_LENGTH) {
        push({ rule: "tag_too_long", severity: "error", message: `Tag "${k.slice(0, 40)}" is longer than ${MAX_TAG_LENGTH} characters, which the API rejects.`, entity: t.ref, entities: [t.ref], location: t.loc });
        break;
      }
    }
    const upgraded = upgradedTags(t.tags);
    if (upgraded) {
      const ref = t.ref;
      push({
        rule: "outdated_tags",
        severity: "warning",
        message: "Some tags are outdated or malformed (deprecated values, empty values or stray whitespace).",
        entity: ref,
        entities: [ref],
        location: t.loc,
        fixes: [
          {
            label: "Upgrade the tags",
            apply: (g) => {
              const e = g.get(ref.type, ref.id);
              const next = e ? upgradedTags(e.tags) : null;
              return e && next ? actions.changeTags(g, ref.type, ref.id, next) : g;
            },
          },
        ],
      });
    }
  }

  // ── contact-tag formatting (Ethiopian phone numbers, URLs, hours) ──
  for (const t of tagged) {
    const fixes: { key: string; value: string }[] = [];
    for (const key of ["phone", "contact:phone", "mobile", "contact:mobile", "fax"]) {
      const v = t.tags[key];
      const fixed = v ? normalizeEthiopianPhone(v) : null;
      if (v && fixed) fixes.push({ key, value: fixed });
    }
    for (const key of ["website", "contact:website", "url"]) {
      const v = t.tags[key];
      const fixed = v ? normalizeUrl(v) : null;
      if (v && fixed) fixes.push({ key, value: fixed });
    }
    if (fixes.length > 0) {
      const ref = t.ref;
      const snapshot = fixes;
      push({
        rule: "formatting",
        severity: "warning",
        message: `${snapshot.map((f) => f.key).join(", ")} ${snapshot.length > 1 ? "aren't" : "isn't"} in the standard format (phones as +251…, websites with https://).`,
        entity: ref,
        entities: [ref],
        location: t.loc,
        fixes: [
          {
            label: "Fix the format",
            apply: (g) => {
              const e = g.get(ref.type, ref.id);
              if (!e) return g;
              const tags = { ...e.tags };
              for (const f of snapshot) if (tags[f.key] !== undefined) tags[f.key] = f.value;
              return actions.changeTags(g, ref.type, ref.id, tags);
            },
          },
        ],
      });
    }
    const hours = t.tags.opening_hours;
    const problem = hours ? openingHoursProblem(hours) : null;
    if (problem) {
      push({ rule: "invalid_hours", severity: "warning", message: `opening_hours looks wrong: ${problem}`, entity: t.ref, entities: [t.ref], location: t.loc });
    }
  }

  // ── source / name hygiene on every scoped entity ─────────────────
  for (const t of tagged) {
    const badSources = Object.entries(t.tags).filter(([k, v]) => (k === "source" || k.startsWith("source:")) && /google/i.test(v));
    if (badSources.length > 0) {
      const ref = t.ref;
      const keys = badSources.map(([k]) => k);
      push({
        rule: "incompatible_source",
        severity: "warning",
        message: "A source tag names Google — its data can't be copied into OpenStreetMap-style data.",
        entity: ref,
        entities: [ref],
        location: t.loc,
        fixes: [
          {
            label: "Remove the source tag",
            apply: (g) => {
              const e = g.get(ref.type, ref.id);
              if (!e) return g;
              const tags = { ...e.tags };
              for (const k of keys) delete tags[k];
              return actions.changeTags(g, ref.type, ref.id, tags);
            },
          },
        ],
      });
    }
    const geomRole = t.ref.type === "node" ? (graph.parentWays(t.ref.id).length > 0 ? "vertex" : "point") : t.ref.type === "way" ? (isClosedWay(graph.way(t.ref.id)!) ? "area" : "line") : null;
    const preset = geomRole ? matchPreset(t.tags, geomRole) : null;
    if (suspiciousName(t.tags, preset?.name ?? null)) {
      const ref = t.ref;
      push({
        rule: "suspicious_name",
        severity: "warning",
        message: `The name "${t.tags.name}" looks like a placeholder or just the feature type, not a real name.`,
        entity: ref,
        entities: [ref],
        location: t.loc,
        fixes: [
          {
            label: "Remove the name",
            apply: (g) => {
              const e = g.get(ref.type, ref.id);
              if (!e) return g;
              const tags = { ...e.tags };
              delete tags.name;
              return actions.changeTags(g, ref.type, ref.id, tags);
            },
          },
        ],
      });
    }
  }

  // ── mutually exclusive tags, private data, help requests ────────
  for (const t of tagged) {
    const ref = t.ref;
    for (const [a, b, subtype] of exclusiveConflicts(t.tags)) {
      push(
        {
          rule: "mutually_exclusive_tags",
          severity: "warning",
          message: subtype === "same_value" ? `"${a}" and "${b}" have the same value, which contradicts itself.` : `"${a}" and "${b}" can't both be set — they say opposite things.`,
          entity: ref,
          entities: [ref],
          location: t.loc,
          fixes: [a, b].map((key) => ({
            label: `Remove "${key}"`,
            apply: (g: Graph) => {
              const e = g.get(ref.type, ref.id);
              if (!e) return g;
              const tags = { ...e.tags };
              delete tags[key];
              return actions.changeTags(g, ref.type, ref.id, tags);
            },
          })),
        },
        `${a}|${b}`,
      );
    }

    if (t.tags.building && PRIVATE_BUILDINGS.has(t.tags.building) && !PUBLIC_KEYS.some((k) => k in t.tags)) {
      const personal = PERSONAL_TAGS.filter((k) => k in t.tags);
      if (personal.length > 0) {
        push({
          rule: "private_data",
          severity: "warning",
          message: `This looks like a private home, but it carries personal contact details (${personal.join(", ")}). Check they're meant to be public.`,
          entity: ref,
          entities: [ref],
          location: t.loc,
          fixes: [
            {
              label: "Remove the personal details",
              apply: (g) => {
                const e = g.get(ref.type, ref.id);
                if (!e) return g;
                const tags = { ...e.tags };
                for (const k of personal) delete tags[k];
                return actions.changeTags(g, ref.type, ref.id, tags);
              },
            },
          ],
        });
      }
    }

    // A fixme someone ELSE left on an existing feature is a request for
    // help; one you just typed is not (iD only flags it if the saved
    // version already had it).
    if (t.tags.fixme && base) {
      const current = graph.get(ref.type, ref.id);
      const saved = base.get(ref.type, ref.id);
      if (current && current.version > 0 && saved?.tags.fixme) {
        push({
          rule: "help_request",
          severity: "warning",
          message: `A mapper asked for help here: "${t.tags.fixme.length > 120 ? t.tags.fixme.slice(0, 120) + "…" : t.tags.fixme}"`,
          entity: ref,
          entities: [ref],
          location: t.loc,
          fixes: [
            {
              label: "I've dealt with it — remove the fixme",
              apply: (g) => {
                const e = g.get(ref.type, ref.id);
                if (!e) return g;
                const tags = { ...e.tags };
                delete tags.fixme;
                return actions.changeTags(g, ref.type, ref.id, tags);
              },
            },
          ],
        });
      }
    }
  }

  // ── standalone points ────────────────────────────────────────────
  for (const node of scopedNodes) {
    if (graph.parentWays(node.id).length > 0) continue;
    const ref = { type: "node" as const, id: node.id };
    const loc = { lat: node.lat, lon: node.lon };
    if (Object.keys(node.tags).length === 0 && graph.parentRelations("node", node.id).length === 0) {
      push({ rule: "missing_tag", severity: "warning", message: "This point has no tags — say what it is.", entity: ref, entities: [ref], location: loc });
    }
    if (impliesArea(node.tags) && node.tags.area !== "no") {
      push({
        rule: "mismatched_geometry",
        severity: "warning",
        message: "This point is tagged as an area (building / landuse / natural area). Draw its outline instead of a single point.",
        entity: ref,
        entities: [ref],
        location: loc,
      });
    }
    const preset = matchPreset(node.tags, "point");
    if (preset?.fields?.some((f) => f.type === "names" || f.key === "name") && !node.tags.name?.trim()) {
      push({ rule: "missing_name", severity: "warning", message: `${preset.name} has no name set.`, entity: ref, entities: [ref], location: loc });
    }
  }

  // ── close nodes (0.2 m) ──────────────────────────────────────────
  if (scopedNodes.length > 0) {
    const nodeTree = new RBush<BBox & { node: NodeEntity }>();
    nodeTree.load(graph.visibleNodes().map((n) => ({ minX: n.lon, maxX: n.lon, minY: n.lat, maxY: n.lat, node: n })));
    const PAD = 0.2 / 111000;
    for (const node of scopedNodes) {
      const near = nodeTree.search({ minX: node.lon - PAD, maxX: node.lon + PAD, minY: node.lat - PAD, maxY: node.lat + PAD });
      for (const { node: other } of near) {
        if (other.id === node.id) continue;
        if (geo.meters(node.lat, node.lon, other.lat, other.lon) > 0.2) continue;
        const nodeWays = graph.parentWays(node.id);
        const otherWays = graph.parentWays(other.id);
        const sharedWay = nodeWays.find((w) => otherWays.some((o) => o.id === w.id));
        const bothPoints = nodeWays.length === 0 && otherWays.length === 0;
        if (!sharedWay && !bothPoints) continue;
        const [a, b] = node.id < other.id ? [node, other] : [other, node];
        const keepTagged = Object.keys(b.tags).length > Object.keys(a.tags).length ? b : a;
        const drop = keepTagged === a ? b : a;
        push(
          {
            rule: "close_nodes",
            severity: "warning",
            message: bothPoints ? "These two points are at (almost) the same location." : "Two nodes of this line are almost on top of each other.",
            entity: { type: "node", id: node.id },
            entities: [
              { type: "node", id: a.id },
              { type: "node", id: b.id },
            ],
            location: { lat: node.lat, lon: node.lon },
            fixes:
              graph.parentRelations("node", drop.id).length === 0 && graph.parentRelations("node", keepTagged.id).length === 0
                ? [{ label: "Merge the nodes", apply: (g) => (g.node(drop.id) && g.node(keepTagged.id) ? actions.mergeNodes(g, keepTagged.id, drop.id) : g) }]
                : undefined,
          },
          "",
        );
      }
    }
  }

  // ── stacked (duplicate / overlapping) roads ──────────────────────
  for (const pair of findStackedWays(graph)) {
    if (!inScope(scope, "way", pair.a.id) && !inScope(scope, "way", pair.b.id)) continue;
    const refA = { type: "way" as const, id: pair.a.id };
    const refB = { type: "way" as const, id: pair.b.id };
    const removeFix = (way: WayEntity): IssueFix => ({
      label: `Delete way #${way.id}${way.tags.name ? ` (${way.tags.name})` : ""} — ${way.nodeIds.length} nodes`,
      apply: (g) => removeWayAndOrphans(g, way.id),
    });
    push({
      rule: pair.kind === "stacked" ? "stacked_ways" : pair.kind === "fork" ? "forked_ways" : "parallel_ways",
      severity: "warning",
      message:
        pair.kind === "stacked"
          ? `Two roads are stacked on top of each other for ${Math.round(pair.overlapMeters)} m (#${pair.a.id} and #${pair.b.id}) — likely a duplicate.`
          : pair.kind === "fork"
            ? `Two roads leave the same node in the same direction and run on top of each other (#${pair.a.id} and #${pair.b.id}) — likely a duplicate branch.`
            : `Two roads run side by side within a few metres for ${Math.round(pair.overlapMeters)} m (#${pair.a.id} and #${pair.b.id}) — likely the same road drawn twice.`,
      entity: refA,
      entities: [refA, refB],
      location: pair.location,
      fixes: [removeFix(pair.a), removeFix(pair.b)],
    });
  }

  // ── crossing ways + almost junctions ─────────────────────────────
  const needSpatial = scopedWays.some((w) => linearClass(w, isClosedWay(w)));
  if (needSpatial) {
    const tree = wayBoxes(graph);

    for (const way of scopedWays) {
      const closedA = isClosedWay(way);
      const clsA = linearClass(way, closedA);
      if (!clsA) continue;
      const ptsA = pointsOf(graph, way);
      if (ptsA.length < 2) continue;
      const box = tree.search({
        minX: Math.min(...ptsA.map((p) => p.node.lon)),
        maxX: Math.max(...ptsA.map((p) => p.node.lon)),
        minY: Math.min(...ptsA.map((p) => p.node.lat)),
        maxY: Math.max(...ptsA.map((p) => p.node.lat)),
      });

      for (const { way: other } of box) {
        if (other.id === way.id) continue;
        const clsB = linearClass(other, isClosedWay(other));
        if (!clsB || crossingAllowed(clsA, clsB, way, other)) continue;
        const ptsB = pointsOf(graph, other);
        let hit: geo.Vec | null = null;
        let hitA = -1;
        let hitB = -1;
        outer: for (let i = 0; i < ptsA.length - 1; i++) {
          for (let j = 0; j < ptsB.length - 1; j++) {
            const x = geo.segmentIntersection(ptsA[i].p, ptsA[i + 1].p, ptsB[j].p, ptsB[j + 1].p);
            if (x) {
              hit = x;
              hitA = i;
              hitB = j;
              break outer;
            }
          }
        }
        if (!hit) continue;
        const [lo, hi] = way.id < other.id ? [way, other] : [other, way];
        const ll = geo.unproject(hit);
        const roadCrossing = clsA === "highway" && clsB === "highway";
        const label = roadCrossing ? "These two roads cross without a junction, bridge or tunnel." : `${clsA === "building" || clsB === "building" ? "A building" : "These ways"} cross${clsA === "building" && clsB === "building" ? " each other" : ""} — this looks wrong.`;
        push({
          rule: "crossing_ways",
          severity: "warning",
          message: label,
          entity: { type: "way", id: way.id },
          entities: [
            { type: "way", id: lo.id },
            { type: "way", id: hi.id },
          ],
          location: ll,
          fixes: roadCrossing
            ? [
                {
                  label: "Add a junction at the crossing",
                  apply: (g, ctx) => {
                    const wa = g.way(way.id);
                    const wb = g.way(other.id);
                    if (!wa || !wb || wa.nodeIds[hitA] !== way.nodeIds[hitA] || wb.nodeIds[hitB] !== other.nodeIds[hitB]) return g;
                    const id = ctx.allocateId("node");
                    let next = actions.createNode(g, id, ll.lat, ll.lon, {});
                    next = actions.insertVertexIntoWay(next, wa.id, hitA + 1, id);
                    next = actions.insertVertexIntoWay(next, wb.id, hitB + 1, id);
                    return next;
                  },
                },
              ]
            : undefined,
        });
      }
    }

    // Almost junction: the free end of a road that stops just short of
    // another road (within ~5 m) without touching it.
    for (const way of scopedWays) {
      if (!way.tags.highway || isClosedWay(way) || way.nodeIds.length < 2) continue;
      for (const endId of [way.nodeIds[0], way.nodeIds[way.nodeIds.length - 1]]) {
        const end = graph.node(endId);
        if (!end) continue;
        const roadParents = graph.parentWays(endId).filter((w) => w.tags.highway);
        if (roadParents.length > 1) continue; // already a junction
        const pad = 6 / 111000;
        const candidates = tree.search({ minX: end.lon - pad, maxX: end.lon + pad, minY: end.lat - pad, maxY: end.lat + pad });
        const endP = geo.project(end.lat, end.lon);
        let best: { way: WayEntity; seg: number; point: geo.Vec; dist: number; nearNode: NodeEntity | null } | null = null;
        let touching = false; // endpoint already lies on another road
        for (const { way: other } of candidates) {
          if (other.id === way.id || !other.tags.highway || isSeparatedVertically(way, other)) continue;
          const pts = pointsOf(graph, other);
          for (let i = 0; i < pts.length - 1; i++) {
            const { point } = geo.closestOnSegment(endP, pts[i].p, pts[i + 1].p);
            const d = geo.dist(endP, point) * Math.cos((end.lat * Math.PI) / 180);
            if (d < 0.05) {
              touching = true;
              break;
            }
            if (d <= 5 && (!best || d < best.dist)) {
              const nearIdx = geo.dist(point, pts[i].p) <= geo.dist(point, pts[i + 1].p) ? i : i + 1;
              const nearNode = geo.dist(point, pts[nearIdx].p) * Math.cos((end.lat * Math.PI) / 180) <= 1.5 ? pts[nearIdx].node : null;
              best = { way: other, seg: i, point, dist: d, nearNode };
            }
          }
        }
        if (touching || !best) continue;
        const target = best;
        push({
          rule: "almost_junction",
          severity: "warning",
          message: `This road ends ${target.dist.toFixed(1)} m short of another road without connecting to it.`,
          entity: { type: "way", id: way.id },
          entities: [
            { type: "way", id: way.id },
            { type: "way", id: target.way.id },
          ],
          location: { lat: end.lat, lon: end.lon },
          fixes: [
            {
              label: "Connect the roads",
              apply: (g) => {
                const e = g.node(endId);
                const t = g.way(target.way.id);
                if (!e || !t) return g;
                if (target.nearNode && g.node(target.nearNode.id)) return actions.mergeNodes(g, target.nearNode.id, endId);
                const ll = geo.unproject(target.point);
                const moved = g.replace({ ...e, lat: ll.lat, lon: ll.lon });
                return actions.insertVertexIntoWay(moved, t.id, target.seg + 1, endId);
              },
            },
          ],
        });
      }
    }
  }

  // ── impossible one-ways ──────────────────────────────────────────
  for (const way of scopedWays) {
    if (!way.tags.highway || !CAR_ROADS.has(way.tags.highway) || isClosedWay(way) || way.nodeIds.length < 2) continue;
    const ends = onewayEnds(way);
    if (!ends) continue;
    const others = (nodeId: number) => graph.parentWays(nodeId).filter((w) => w.id !== way.id && w.tags.highway && CAR_ROADS.has(w.tags.highway));
    const problems: string[] = [];
    const atStart = others(ends.start);
    // Nothing can arrive at the start if every connected road is a
    // one-way that itself starts there (traffic only flows away).
    if (atStart.length > 0 && atStart.every((w) => onewayEnds(w)?.start === ends.start)) problems.push("can't be entered: every connected road is one-way and leads away from its start");
    const atEnd = others(ends.end);
    if (atEnd.length > 0 && atEnd.every((w) => onewayEnds(w)?.end === ends.end)) problems.push("can't be left: every connected road is one-way and leads into its end");
    if (problems.length > 0) {
      const ref = { type: "way" as const, id: way.id };
      const first = graph.node(way.nodeIds[0]);
      push({
        rule: "impossible_oneway",
        severity: "warning",
        message: `This one-way road ${problems.join("; and ")}.`,
        entity: ref,
        entities: [ref],
        location: first ? { lat: first.lat, lon: first.lon } : undefined,
        fixes: [{ label: "Reverse its direction", apply: (g) => (g.way(way.id) ? actions.reverseWay(g, way.id) : g) }],
      });
    }
  }

  // ── disconnected new roads ───────────────────────────────────────
  // Only brand-new roads (negative ids): on a bbox-scoped load we can't
  // tell whether an old road continues outside the view, but a road the
  // user just drew with no junction at all is almost always a mistake.
  const newRoads = scopedWays.filter((w) => w.id < 0 && w.tags.highway && !isClosedWay(w));
  if (newRoads.length > 0) {
    const roads = graph.visibleWays().filter((w) => w.tags.highway);
    const byNode = new Map<number, WayEntity[]>();
    for (const r of roads) for (const n of r.nodeIds) (byNode.get(n) ?? byNode.set(n, []).get(n)!).push(r);
    const handled = new Set<number>();
    for (const start of newRoads) {
      if (handled.has(start.id)) continue;
      const comp = new Set<number>([start.id]);
      const stack = [start];
      while (stack.length) {
        const w = stack.pop()!;
        for (const n of w.nodeIds)
          for (const nb of byNode.get(n) ?? [])
            if (!comp.has(nb.id)) {
              comp.add(nb.id);
              stack.push(nb);
            }
      }
      comp.forEach((id) => handled.add(id));
      const allNew = [...comp].every((id) => id < 0);
      if (!allNew) continue;
      const first = graph.node(start.nodeIds[0]);
      push({
        rule: "disconnected_way",
        severity: "warning",
        message: "This new road isn't connected to any other road.",
        entity: { type: "way", id: start.id },
        entities: [...comp].map((id) => ({ type: "way" as const, id })),
        location: first ? { lat: first.lat, lon: first.lon } : undefined,
      });
    }
  }

  // ── relations ────────────────────────────────────────────────────
  for (const rel of scopedRelations) {
    const ref = { type: "relation" as const, id: rel.id };
    if (!rel.tags.type) {
      push({ rule: "missing_tag", severity: "error", message: "This relation has no type tag.", entity: ref, entities: [ref] });
    }
    if (rel.members.length > MAX_RELATION_MEMBERS) {
      push({ rule: "relation_too_large", severity: "error", message: `Relation has ${rel.members.length} members; the API allows ${MAX_RELATION_MEMBERS}.`, entity: ref, entities: [ref] });
    }
    if ((rel.tags.type === "multipolygon" || rel.tags.type === "boundary") && rel.members.some((m) => m.type === "way" && !m.role)) {
      push({ rule: "missing_role", severity: "warning", message: "Some members of this multipolygon have no role (outer/inner).", entity: ref, entities: [ref] });
    }
  }

  return issues.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "error" ? -1 : 1));
}
