"use client";

import "leaflet/dist/leaflet.css";
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, Marker, Polygon, Polyline, Rectangle, TileLayer, Tooltip, useMap, useMapEvent } from "react-leaflet";
import L from "leaflet";
import type { EditorStore } from "./useEditorStore";
import * as graphActions from "./lib/actions";
import { wouldSelfIntersect } from "./lib/drawing";
import { classifyEditState, type EditState } from "./lib/editState";
import { isDanglingEndpoint, isImportantVertex, wayRole } from "./lib/geometryRoles";
import { labelCandidate, planLabels, setsEqual, type LabelCandidate } from "./lib/labels";
import { findSnap } from "./lib/snapping";
import { SpatialIndex } from "./lib/spatialIndex";
import {
  classifyAeroway,
  classifyAreaColor,
  classifyRailway,
  classifyRoad,
  classifyWaterway,
  EDIT_DIFF_COLORS,
  HOVER_OPACITY,
  HOVER_SELECT_COLOR,
  isProposed,
  SELECTED_OPACITY,
  shadowWidth,
  widthAt,
  WIDTHS,
  type LineStyle,
} from "./lib/styles";
import { midpointDivIcon, onewayArrowIcon, pinDivIcon, presetIconHtml, vertexDivIcon } from "./lib/mapIcons";
import { matchPreset } from "./lib/presets";
import type { Graph, NodeEntity, OsmTags, WayEntity } from "./lib/graph";
import DrawController from "./DrawController";
import MapNavigation from "./MapNavigation";
import TransformController from "./TransformController";
import { filterFeatures } from "./lib/featureFilters";
import { noteDivIcon } from "./lib/noteIcon";
import * as geo from "./lib/geo";
import { API_BASE_URL } from "@/lib/api-config";
import { findStackedWays } from "./lib/stackedWays";
import { metersPerPixel, resolveImagery, resolveTileUrl } from "./lib/imagery";
import type { ImagerySettings } from "./lib/prefs";
import { scopeFromDiff } from "./lib/validation";

// Composes react-leaflet directly against the graph/store — Geoman is
// no longer the interaction driver here (see map-editor-full-spec.md's
// plan: exact click-vs-drag/snap/self-intersection mechanics aren't
// expressible through Geoman's high-level enableDraw() API). Draw/drag
// pointer handling is layered on top of this render in later phases;
// `features/address/nodes/` keeps its own separate Geoman setup
// untouched.

// ── Line ways ───────────────────────────────────────────────────────
// Each way is its own memoized component so hovering or selecting one
// feature re-renders that feature only. Rendering every way inline made
// each mouseover re-style and re-draw every polyline in view, which is
// what made dense areas crawl.
const positionCache = new WeakMap<WayEntity, { nodes: NodeEntity[]; positions: [number, number][] }>();
function wayPositions(graph: Graph, way: WayEntity): [number, number][] {
  const nodes = graph.childNodes(way);
  const hit = positionCache.get(way);
  if (hit && hit.nodes.length === nodes.length && hit.nodes.every((n, i) => n === nodes[i])) return hit.positions;
  const positions = nodes.map((n) => [n.lat, n.lon] as [number, number]);
  positionCache.set(way, { nodes, positions });
  return positions;
}

// Drawn-width multiplier from the `lanes` tag: the stock widths assume a
// typical two-lane road, so 4 lanes draws twice as wide and 1 lane narrower.
function laneScale(tags: OsmTags): number {
  const n = parseInt(tags.lanes ?? "", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(4, Math.max(0.75, n / 2));
}

interface LineWayViewProps {
  way: WayEntity;
  positions: [number, number][];
  isSelected: boolean;
  isHovered: boolean;
  zoom: number;
  wireframe: boolean;
  editState: EditState;
  labeled: boolean;
  interactive: boolean;
  onSelect: (way: WayEntity, shift: boolean, anchor: { x: number; y: number }) => void;
  onHover: (key: string | null) => void;
  onAddNode: (way: WayEntity, lat: number, lon: number) => void;
}

const LineWayView = memo(function LineWayView({ way, positions, isSelected, isHovered, zoom, wireframe, editState, labeled, interactive, onSelect, onHover, onAddNode }: LineWayViewProps) {
  const key = `w${way.id}`;
  const style = wireframe ? DEFAULT_LINE_STYLE : resolveLineStyle(way.tags);
  const w = widthAt(style.widths, zoom);
  const lanes = laneScale(way.tags);
  w.casing *= lanes;
  w.stroke *= lanes;
  // §3.5: a proposed (not-yet-built) road/path renders noticeably
  // thinner than the same tag once actually built.
  const proposed = !wireframe && isProposed(way.tags);
  if (proposed) {
    w.casing *= 0.6;
    w.stroke *= 0.6;
  }
  return (
    <div>
      {isSelected || isHovered ? (
        <Polyline
          positions={positions}
          pathOptions={{
            color: HOVER_SELECT_COLOR,
            weight: shadowWidth(style.wide ? "wide" : "narrow", zoom) * lanes,
            opacity: isSelected ? SELECTED_OPACITY.line : HOVER_OPACITY.line,
          }}
          interactive={false}
        />
      ) : editState ? (
        <Polyline
          positions={positions}
          pathOptions={{ color: EDIT_DIFF_COLORS[editState], weight: shadowWidth(style.wide ? "wide" : "narrow", zoom) * lanes, opacity: 0.8 }}
          interactive={false}
        />
      ) : null}
      {style.casing ? <Polyline positions={positions} pathOptions={{ color: style.casing, weight: w.casing, opacity: 1 }} interactive={false} /> : null}
      <Polyline
        positions={positions}
        pathOptions={{ color: style.stroke, weight: w.stroke, opacity: 1, dashArray: proposed ? "4,4" : style.strokeDash }}
        interactive
        eventHandlers={{
          click: (e) => {
            if (!interactive) return;
            L.DomEvent.stopPropagation(e);
            onSelect(way, e.originalEvent.shiftKey, { x: e.originalEvent.clientX, y: e.originalEvent.clientY });
          },
          // Double-click on a road adds a node right there (iD-style).
          dblclick: (e) => {
            if (!interactive) return;
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e.originalEvent);
            onAddNode(way, e.latlng.lat, e.latlng.lng);
          },
          mouseover: () => interactive && onHover(key),
          mouseout: () => onHover(null),
        }}
      >
        {/* No name on the selected way: its label (and the hover tooltip that
            follows the cursor) sits right on the segment midpoints used to add nodes. */}
        {isSelected ? null : (
          <Tooltip sticky={!labeled} permanent={labeled} direction="center" className={labeled ? "osm-editor-label" : undefined}>
            {tagLabel(way.tags, `way #${way.id}`)}
          </Tooltip>
        )}
      </Polyline>
    </div>
  );
});

function tagLabel(tags: OsmTags, fallback: string): string {
  return tags.name ?? tags.amenity ?? tags.highway ?? tags.shop ?? tags.building ?? fallback;
}

const DEFAULT_LINE_STYLE: LineStyle = { stroke: "#9e9e9e", casing: "#666", widths: WIDTHS.minorRoad };

function resolveLineStyle(tags: OsmTags): LineStyle {
  return classifyRoad(tags) ?? classifyRailway(tags) ?? classifyWaterway(tags) ?? classifyAeroway(tags) ?? DEFAULT_LINE_STYLE;
}

function ZoomTracker({ onZoom }: { onZoom: (z: number) => void }) {
  const map = useMap();
  useEffect(() => {
    onZoom(map.getZoom());
  }, [map, onZoom]);
  useMapEvent("zoomend", (e) => onZoom(e.target.getZoom()));
  return null;
}

function ViewTracker({ registerBoundsGetter }: { registerBoundsGetter: (getter: () => L.LatLngBounds) => void }) {
  const map = useMap();
  useEffect(() => {
    registerBoundsGetter(() => map.getBounds());
  }, [map, registerBoundsGetter]);
  return null;
}

// `MapContainer` (react-leaflet v5) captures `className` once via
// `useState(() => ({ className, ... }))` at mount and never re-applies
// it — so a className prop that changes with `mode` is silently
// ignored after first render. Toggling the class on the real DOM
// container directly (via the map instance, not React props) is what
// actually works.
function DrawingClassToggle({ active }: { active: boolean }) {
  const map = useMap();
  useEffect(() => {
    map.getContainer().classList.toggle("osm-editor-drawing", active);
  }, [map, active]);
  return null;
}

// Captures the live map instance into a ref for OsmEditorMap's own
// event handlers to read — OsmEditorMap can't call useMap() itself
// (it's the component that renders <MapContainer>, not a descendant of
// it), so this is the same "small tracker component + ref" pattern as
// ViewTracker, just exposing the map object itself rather than a bounds
// getter.
function MapRefCapture({ mapRef, store }: { mapRef: React.MutableRefObject<L.Map | null>; store: EditorStore }) {
  const map = useMap();
  const { registerMap } = store;
  useEffect(() => {
    mapRef.current = map;
    // Also publish to the store so the keyboard-shortcut layer (pan, zoom,
    // fit) can drive the map.
    registerMap(map);
    return () => registerMap(null);
  }, [map, mapRef, registerMap]);
  return null;
}

// A true background click (every entity layer stops propagation on its
// own click) deselects in Select mode — clicking empty space is the
// mechanism for "replace selection with nothing" (§C8).
function BackgroundClick({ mode, clearSelection, disabled }: { mode: EditorStore["mode"]; clearSelection: () => void; disabled: boolean }) {
  useMapEvent("click", () => {
    // `disabled` while a Move/Rotate is live: that same click is what
    // confirms the transform and must not also drop the selection.
    if (mode === "select" && !disabled) clearSelection();
  });
  return null;
}

// Highest zoom the map allows; imagery tiles are upscaled beyond their own max.
const MAX_MAP_ZOOM = 23;

// Background imagery (Background panel). Tiles live in their own pane so
// the whole layer can be nudged by a ground-meter offset — for aerial
// sources that sit a few meters off the real ground. The offset is
// converted to pixels from the current zoom/latitude on every render
// (zoom is state, so a zoom re-renders), keeping it the same ground
// distance at every scale.
function ImageryHost({ settings, zoom }: { settings: ImagerySettings; zoom: number }) {
  const map = useMap();
  // Panes must exist before the TileLayer that names one is added;
  // creating it in a one-time state initializer is idempotent and safe.
  useState(() => {
    if (!map.getPane("imagery")) map.createPane("imagery").style.zIndex = "150";
    return true;
  });
  const layer = resolveImagery(settings.id, settings.customUrl);
  const mpp = metersPerPixel(map.getCenter().lat, zoom);
  const dx = settings.offsetX / mpp;
  const dy = -settings.offsetY / mpp; // north is up the screen (-y)
  useEffect(() => {
    const pane = map.getPane("imagery");
    if (pane) pane.style.transform = dx === 0 && dy === 0 ? "" : `translate(${dx}px, ${dy}px)`;
  }, [map, dx, dy]);
  if (!layer) return null;
  return (
    <TileLayer
      key={`${layer.id}:${layer.url}`}
      pane="imagery"
      attribution={layer.attribution}
      url={resolveTileUrl(layer, API_BASE_URL)}
      // CORS-enabled so the Auto-trace tool can read tile pixels from a canvas.
      crossOrigin={layer.google ? "anonymous" : undefined}
      // Past the provider's last zoom, tiles are upscaled instead of capping the map.
      maxZoom={MAX_MAP_ZOOM}
      maxNativeZoom={layer.maxZoom}
      subdomains={layer.subdomains ?? "abc"}
      opacity={settings.opacity}
    />
  );
}

// Pans/zooms the map when something outside it (the Issues panel) asks
// to focus a location.
function FocusController({ request }: { request: EditorStore["focusRequest"] }) {
  const map = useMap();
  useEffect(() => {
    if (!request) return;
    const animate = request.animate ?? true;
    if (request.fit) {
      const f = request.fit;
      map.fitBounds(
        [
          [f.minLat, f.minLon],
          [f.maxLat, f.maxLon],
        ],
        { maxZoom: 20, padding: [40, 40], animate },
      );
    } else {
      // An explicit zoom is honored exactly (Go to a z14 tile means z14);
      // no zoom keeps the current one.
      map.setView([request.lat, request.lon], request.zoom ?? map.getZoom(), { animate });
    }
  }, [request, map]);
  return null;
}

// Direction arrows along one-way roads (oneway=yes/-1, roundabouts), so you can
// see which way traffic goes. Placed every ~90 screen px along each visible
// way, recomputed when the view changes; skipped when zoomed far out.
const ONEWAY_MIN_ZOOM = 16;
const ONEWAY_SPACING_PX = 90;

function onewayDirection(way: WayEntity): 1 | -1 | 0 {
  const v = way.tags.oneway;
  if (v === "-1") return -1;
  if (v === "yes" || v === "true" || v === "1") return 1;
  if (v === "no") return 0;
  return way.tags.junction === "roundabout" || way.tags.junction === "circular" ? 1 : 0;
}

function OnewayArrows({ graph, ways, zoom }: { graph: Graph; ways: WayEntity[]; zoom: number }) {
  const map = useMap();
  const [view, setView] = useState(0);
  useMapEvent("moveend", () => setView((v) => v + 1));
  const arrows = useMemo(() => {
    void view; // recompute on pan/zoom
    if (zoom < ONEWAY_MIN_ZOOM) return [];
    const bounds = map.getBounds().pad(0.1);
    const out: { key: string; lat: number; lon: number; angle: number; size: number }[] = [];
    for (const way of ways) {
      const dir = onewayDirection(way);
      if (dir === 0 || !way.tags.highway) continue;
      // Never wider than the road itself as drawn at this zoom.
      const size = widthAt(resolveLineStyle(way.tags).widths, zoom).stroke * laneScale(way.tags);
      const nodes = graph.childNodes(way);
      let carry = ONEWAY_SPACING_PX / 2; // first arrow half a spacing in
      for (let i = 0; i < nodes.length - 1; i++) {
        const a = nodes[i];
        const b = nodes[i + 1];
        if (!bounds.contains([a.lat, a.lon]) && !bounds.contains([b.lat, b.lon])) continue;
        const pa = map.latLngToContainerPoint([a.lat, a.lon]);
        const pb = map.latLngToContainerPoint([b.lat, b.lon]);
        const len = pa.distanceTo(pb);
        if (len === 0) continue;
        const angle = (Math.atan2(pb.y - pa.y, pb.x - pa.x) * 180) / Math.PI + (dir === -1 ? 180 : 0);
        let d = carry;
        let n = 0;
        while (d <= len) {
          const t = d / len;
          out.push({ key: `ow-${way.id}-${i}-${n++}`, lat: a.lat + (b.lat - a.lat) * t, lon: a.lon + (b.lon - a.lon) * t, angle, size });
          d += ONEWAY_SPACING_PX;
        }
        carry = d - len;
      }
    }
    return out;
  }, [graph, ways, zoom, map, view]);
  return (
    <>
      {arrows.map((a) => (
        <Marker key={a.key} position={[a.lat, a.lon]} icon={onewayArrowIcon(a.angle, a.size)} interactive={false} keyboard={false} />
      ))}
    </>
  );
}

// Marks stretches where two roads sit on top of each other (duplicates), so
// they stand out on the loaded data. Recomputed off the render path.
function StackedWaysOverlay({ graph }: { graph: Graph }) {
  const deferred = useDeferredValue(graph);
  const pairs = useMemo(() => findStackedWays(deferred), [deferred]);
  return (
    <>
      {pairs.flatMap((pair) =>
        pair.stretches.map((stretch, i) => (
          <Polyline
            key={`stack-${pair.kind}-${pair.a.id}-${pair.b.id}-${i}`}
            positions={stretch.map((p) => [p.lat, p.lon] as [number, number])}
            pathOptions={{ color: pair.kind === "stacked" ? "#ff1744" : pair.kind === "fork" ? "#d500f9" : "#ff9100", weight: 9, opacity: 0.55, lineCap: "butt" }}
            interactive={false}
          />
        )),
      )}
    </>
  );
}

// Midpoint markers (§C4) for the selected way's segments that render
// >40px apart. A separate component (rather than inline in
// OsmEditorMap's render) specifically so it can call useMap() — pixel
// distance depends on the live map instance, and OsmEditorMap itself
// isn't a descendant of MapContainer's context, only its parent.
function Midpoints({ store, promote }: { store: EditorStore; promote: (way: WayEntity, atIndex: number, lat: number, lon: number) => void }) {
  const map = useMap();
  const { graph, selection } = store;

  return (
    <>
      {selection
        .filter((s): s is { type: "way"; id: number } => s.type === "way")
        .flatMap((s) => {
          const way = graph.way(s.id);
          if (!way) return [];
          const wayNodes = graph.childNodes(way);
          const items: { key: string; lat: number; lon: number; atIndex: number }[] = [];
          for (let i = 0; i < wayNodes.length - 1; i++) {
            const a = wayNodes[i];
            const b = wayNodes[i + 1];
            const pa = map.latLngToContainerPoint([a.lat, a.lon]);
            const pb = map.latLngToContainerPoint([b.lat, b.lon]);
            if (pa.distanceTo(pb) <= 40) continue;
            items.push({ key: `mid-${way.id}-${i}`, lat: (a.lat + b.lat) / 2, lon: (a.lon + b.lon) / 2, atIndex: i + 1 });
          }
          return items.map((item) => (
            <Marker
              key={item.key}
              position={[item.lat, item.lon]}
              icon={midpointDivIcon()}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e);
                  promote(way, item.atIndex, item.lat, item.lon);
                },
              }}
            />
          ));
        })}
    </>
  );
}

// Recomputes the label collision plan (lib/labels.ts) whenever the
// candidate set or the map's own pan/zoom changes, reporting the result
// up via a callback — the same "child owns useMap(), parent owns state"
// split as Midpoints/ViewTracker, since label pixel positions depend on
// the live map instance OsmEditorMap itself can't reach.
function LabelPlanner({
  candidates,
  tagsByKey,
  onPlan,
}: {
  candidates: LabelCandidate[];
  tagsByKey: Map<string, OsmTags>;
  onPlan: (plan: Set<string>) => void;
}) {
  const map = useMap();
  const recompute = () => onPlan(planLabels(map, candidates, tagsByKey));
  useEffect(recompute, [map, candidates, tagsByKey, onPlan]);
  useMapEvent("moveend", recompute);
  useMapEvent("zoomend", recompute);
  return null;
}

type Props = {
  store: EditorStore;
  registerBoundsGetter: (getter: () => L.LatLngBounds) => void;
  loadedAreaBounds: L.LatLngBoundsExpression | null;
};

export default function OsmEditorMap({ store, registerBoundsGetter, loadedAreaBounds }: Props) {
  const { graph, selection, hoveredKey, setHoveredKey, select, mode, zoom, setZoom, wireframe, changeset } = store;

  // §B5: below the minimum editable zoom the app is browse-only, and
  // existing entities go non-interactive while drawing so clicks pass
  // through to DrawController instead of selecting something.
  // NOTE: layers below are always created `interactive` — react-leaflet only
  // reads that prop at mount, so toggling it per mode left layers that were
  // (re)mounted during a draw session permanently unclickable. Draw/transform
  // modes are handled by CSS (pointer-events: none on the container class)
  // and the min-zoom gate by checking `interactive` inside each handler.
  const interactive = zoom >= store.minEditZoom && (mode === "browse" || mode === "select") && !store.transform;

  // Map Data filters: hide whole feature classes, but never anything
  // that's selected or edited this session.
  const hiddenSet = useMemo(() => new Set(store.hiddenFeatures), [store.hiddenFeatures]);
  const alwaysShow = useMemo(() => {
    const keys = scopeFromDiff(store.pendingDiff);
    for (const s of selection) keys.add(`${s.type === "node" ? "n" : s.type === "way" ? "w" : "r"}${s.id}`);
    return keys;
  }, [store.pendingDiff, selection]);
  const { ways, nodes } = useMemo(
    () => (store.dataVisible ? filterFeatures(graph, hiddenSet, alwaysShow) : { ways: [], nodes: [] }),
    [graph, hiddenSet, alwaysShow, store.dataVisible],
  );

  // Multipolygon relations (outer rings with holes) — drawn as one filled
  // polygon with holes. Their untagged member rings stop filling on their
  // own (they'd paint over the holes) and render as plain outlines.
  const multipolygons = useMemo(() => {
    const out: { id: number; tags: OsmTags; rings: [number, number][][] }[] = [];
    if (!store.dataVisible) return out;
    for (const rel of graph.visibleRelations()) {
      if (rel.tags.type !== "multipolygon" && rel.tags.type !== "boundary") continue;
      const ringOf = (m: { ref: number }) => {
        const w = graph.way(m.ref);
        if (!w || !w.visible || w.nodeIds.length < 4 || w.nodeIds[0] !== w.nodeIds[w.nodeIds.length - 1]) return null;
        const pts = graph.childNodes(w);
        return pts.length === w.nodeIds.length ? pts : null;
      };
      const outers = rel.members.filter((m) => m.type === "way" && m.role !== "inner").map(ringOf).filter((r): r is NodeEntity[] => !!r);
      const inners = rel.members.filter((m) => m.type === "way" && m.role === "inner").map(ringOf).filter((r): r is NodeEntity[] => !!r);
      for (const outer of outers) {
        const outerVec = outer.slice(0, -1).map((n) => geo.project(n.lat, n.lon));
        const holes = inners.filter((h) => geo.pointInRing(geo.project(h[0].lat, h[0].lon), outerVec));
        out.push({ id: rel.id, tags: rel.tags, rings: [outer, ...holes].map((r) => r.map((n) => [n.lat, n.lon] as [number, number])) });
      }
    }
    return out;
  }, [graph, store.dataVisible]);

  const { areaWays, lineWays } = useMemo(() => {
    const areaWays: WayEntity[] = [];
    const lineWays: WayEntity[] = [];
    const inMultipolygon = new Set<number>();
    for (const rel of graph.visibleRelations()) {
      if (rel.tags.type === "multipolygon" || rel.tags.type === "boundary") for (const m of rel.members) if (m.type === "way") inMultipolygon.add(m.ref);
    }
    for (const w of ways) {
      const untaggedMember = inMultipolygon.has(w.id) && Object.keys(w.tags).length === 0;
      (wayRole(w) === "area" && !wireframe && !untaggedMember ? areaWays : lineWays).push(w);
    }
    return { areaWays, lineWays };
  }, [ways, wireframe, graph]);

  const selectedWayIds = useMemo(() => new Set(selection.filter((s) => s.type === "way").map((s) => s.id)), [selection]);
  const selectedNodeIds = useMemo(() => new Set(selection.filter((s) => s.type === "node").map((s) => s.id)), [selection]);

  // "Sibling" highlight (§C6): vertices belonging to a selected way.
  const siblingNodeIds = useMemo(() => {
    const ids = new Set<number>();
    for (const w of ways) if (selectedWayIds.has(w.id)) for (const id of w.nodeIds) ids.add(id);
    return ids;
  }, [ways, selectedWayIds]);

  const wayNodeIds = useMemo(() => {
    const ids = new Set<number>();
    for (const w of ways) for (const id of w.nodeIds) ids.add(id);
    return ids;
  }, [ways]);

  // Labels (§3): named features only, at a zoom where text is legible.
  const [labeledKeys, setLabeledKeys] = useState<Set<string>>(() => new Set());
  const handleLabelPlan = useCallback((plan: Set<string>) => {
    setLabeledKeys((prev) => (setsEqual(prev, plan) ? prev : plan));
  }, []);
  const { labelCandidates, labelTagsByKey } = useMemo(() => {
    const candidates: LabelCandidate[] = [];
    const tagsByKey = new Map<string, OsmTags>();
    if (zoom >= 15) {
      for (const n of nodes) {
        const c = labelCandidate(`n${n.id}`, n.tags, n.lat, n.lon);
        if (c) {
          candidates.push(c);
          tagsByKey.set(c.key, n.tags);
        }
      }
      for (const w of ways) {
        const pts = graph.childNodes(w);
        if (pts.length === 0) continue;
        const lat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
        const lon = pts.reduce((s, p) => s + p.lon, 0) / pts.length;
        const c = labelCandidate(`w${w.id}`, w.tags, lat, lon);
        if (c) {
          candidates.push(c);
          tagsByKey.set(c.key, w.tags);
        }
      }
    }
    return { labelCandidates: candidates, labelTagsByKey: tagsByKey };
  }, [nodes, ways, graph, zoom]);

  function selectWay(way: WayEntity, shift: boolean, _anchor: { x: number; y: number }) {
    // anchor intentionally unused: the edit menu opens on right-click only
    select({ type: "way", id: way.id }, shift);
  }
  function selectNode(node: NodeEntity, shift: boolean, _anchor: { x: number; y: number }) {
    select({ type: "node", id: node.id }, shift);
  }

  // Stable wrappers (latest closure via a ref) so memoized ways don't
  // re-render just because these callbacks were recreated.
  const selectWayRef = useRef(selectWay);
  useEffect(() => {
    selectWayRef.current = selectWay;
  });
  const selectWayStable = useCallback((way: WayEntity, shift: boolean, anchor: { x: number; y: number }) => selectWayRef.current(way, shift, anchor), []);
  // Canvas hit-testing is exact to the drawn stroke, so a 2px residential road
  // was very hard to hit; a few px of tolerance makes it as easy as a thick one.
  const [canvasRenderer] = useState(() => L.canvas({ tolerance: 4 }));
  const hoverStable = useCallback((key: string | null) => setHoveredKey(key), [setHoveredKey]);

  const mapRef = useRef<L.Map | null>(null);

  // Shared drag-to-move handler (§C5) for both standalone points and
  // selected vertices: drop onto another node merges the two, drop onto
  // a way's interior inserts as a new vertex there, and either kind of
  // self-intersection this would cause blocks the move and snaps the
  // marker back to its pre-drag position — done by imperatively calling
  // `marker.setLatLng` rather than relying on the `position` prop
  // round-tripping, since react-leaflet won't re-push an unchanged
  // position value after Leaflet's own drag handler already moved the
  // marker's real DOM position out from under it.
  function handleNodeDragEnd(node: NodeEntity, e: L.DragEndEvent) {
    const marker = e.target as L.Marker;
    const latlng = marker.getLatLng();
    const map = mapRef.current;

    function revert() {
      marker.setLatLng([node.lat, node.lon]);
    }
    if (!map) {
      revert();
      return;
    }

    // A "drag" that never left the marker is a click. Without this guard
    // the marker's pixel-derived position (differs from the stored
    // coordinate by float noise) would be committed as a move, leaving a
    // phantom "modified" node that bumps its version on the next save.
    const from = map.latLngToContainerPoint([node.lat, node.lon]);
    const to = map.latLngToContainerPoint(latlng);
    if (from.distanceTo(to) < 3) {
      revert();
      return;
    }

    const index = new SpatialIndex(graph);
    const snap = findSnap(L, map, index, latlng.lat, latlng.lng, new Set([node.id]));

    if (snap?.kind === "node") {
      // Relation-integrity guard (§C5): a merge involving a node that's
      // itself a relation member (turn restriction via/from/to,
      // multipolygon outer/inner, etc.) is blocked rather than silently
      // corrupting that relation's membership.
      if (graph.parentRelations("node", node.id).length > 0 || graph.parentRelations("node", snap.node.id).length > 0) {
        revert();
        return;
      }
      store.commitGraph(graphActions.mergeNodes(graph, snap.node.id, node.id));
      store.select({ type: "node", id: snap.node.id }, false);
      return;
    }

    if (snap?.kind === "way") {
      const coords = graph.childNodes(snap.way).map((n) => ({ lat: n.lat, lon: n.lon }));
      coords.splice(snap.segmentIndex + 1, 0, { lat: snap.lat, lon: snap.lon });
      if (wouldSelfIntersect(coords)) {
        revert();
        return;
      }
      let g: Graph = graphActions.moveNode(graph, node.id, snap.lat, snap.lon);
      g = graphActions.insertVertexIntoWay(g, snap.way.id, snap.segmentIndex + 1, node.id);
      store.commitGraph(g);
      return;
    }

    for (const way of graph.parentWays(node.id)) {
      const coords = graph.childNodes(way).map((n) => (n.id === node.id ? { lat: latlng.lat, lon: latlng.lng } : { lat: n.lat, lon: n.lon }));
      if (wouldSelfIntersect(coords)) {
        revert();
        return;
      }
    }
    store.moveNode(node.id, latlng.lat, latlng.lng);
  }

  function promoteMidpoint(way: WayEntity, atIndex: number, lat: number, lon: number) {
    const id = store.allocateId("node");
    store.commitGraph(graphActions.insertVertexIntoWay(graphActions.createNode(graph, id, lat, lon, {}), way.id, atIndex, id));
    store.select({ type: "node", id }, false);
  }

  // Double-click on a road: insert a node on the nearest segment, at the
  // point on that segment closest to the click, and select it.
  function addNodeOnWay(way: WayEntity, lat: number, lon: number) {
    const map = mapRef.current;
    if (!map || !store.changeset || store.mode !== "select") return;
    const nodes = graph.childNodes(way);
    const click = map.latLngToContainerPoint([lat, lon]);
    let best = { index: -1, dist: Infinity, point: click };
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = map.latLngToContainerPoint([nodes[i].lat, nodes[i].lon]);
      const b = map.latLngToContainerPoint([nodes[i + 1].lat, nodes[i + 1].lon]);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const l2 = dx * dx + dy * dy;
      const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((click.x - a.x) * dx + (click.y - a.y) * dy) / l2));
      const point = L.point(a.x + t * dx, a.y + t * dy);
      const d = point.distanceTo(click);
      if (d < best.dist) best = { index: i, dist: d, point };
    }
    if (best.index < 0) return;
    const at = map.containerPointToLatLng(best.point);
    // Don't stack a node on top of an existing vertex.
    const near = nodes.some((n) => map.latLngToContainerPoint([n.lat, n.lon]).distanceTo(best.point) < 5);
    if (near) return;
    promoteMidpoint(way, best.index + 1, at.lat, at.lng);
  }
  const addNodeRef = useRef(addNodeOnWay);
  useEffect(() => {
    addNodeRef.current = addNodeOnWay;
  });
  const addNodeStable = useCallback((way: WayEntity, lat: number, lon: number) => addNodeRef.current(way, lat, lon), []);

  // react-leaflet doesn't reliably re-apply a Path/Marker's `interactive`
  // constructor option on prop updates (it's baked in at layer creation,
  // not treated as a live style like pathOptions is) — so toggling the
  // `interactive` prop alone leaves already-mounted ways/nodes clickable
  // even after switching into a draw mode. Enforced instead via a CSS
  // pointer-events override toggled directly on the map container's DOM
  // node (see DrawingClassToggle), which works regardless of when each
  // layer was created.
  // preferCanvas: vector layers draw on one <canvas> instead of thousands of
  // SVG nodes (the editor crawled on dense areas). Canvas hit-testing ignores
  // per-layer CSS, so the same modes also switch the canvas's own
  // pointer-events off (see the <style> block below).
  const drawingActive = mode === "drawPoint" || mode === "drawLine" || mode === "drawArea" || mode === "addNote";

  return (
    <MapContainer center={[9.03, 38.74]} zoom={14} maxZoom={MAX_MAP_ZOOM} doubleClickZoom={false} style={{ height: "100%", width: "100%" }} scrollWheelZoom keyboard={false} renderer={canvasRenderer}>
      <style>{`
        .osm-editor-boundary-draw { cursor: crosshair !important; }
        .osm-editor-boundary-draw .leaflet-interactive, .osm-editor-boundary-draw .leaflet-marker-icon, .osm-editor-boundary-draw .leaflet-overlay-pane canvas { pointer-events: none !important; }
        .osm-editor-transforming { cursor: move !important; }
        .osm-editor-transforming .leaflet-interactive, .osm-editor-transforming .leaflet-marker-icon, .osm-editor-transforming .leaflet-overlay-pane canvas { pointer-events: none !important; }
        .osm-editor-drawing .leaflet-interactive, .osm-editor-drawing .leaflet-marker-icon, .osm-editor-drawing .leaflet-overlay-pane canvas { pointer-events: none !important; }
        .leaflet-tooltip, .leaflet-tooltip.leaflet-interactive { pointer-events: none !important; }
        .osm-editor-label {
          background: transparent; border: none; box-shadow: none; padding: 0;
          font-size: 11px; font-weight: 600; color: #222;
          text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 0 3px #fff;
          pointer-events: none;
        }
        .osm-editor-label::before { display: none; }
      `}</style>
      <ImageryHost settings={store.imagery} zoom={zoom} />
      <ZoomTracker onZoom={setZoom} />
      <ViewTracker registerBoundsGetter={registerBoundsGetter} />
      <MapRefCapture mapRef={mapRef} store={store} />
      <DrawingClassToggle active={drawingActive} />
      <BackgroundClick mode={mode} clearSelection={store.clearSelection} disabled={!!store.transform} />
      <FocusController request={store.focusRequest} />
      {store.issueHighlight ? (
        <>
          {store.issueHighlight.segment ? (
            <Polyline positions={store.issueHighlight.segment} pathOptions={{ color: "#ef4444", weight: 8, opacity: 0.9, dashArray: "4 8" }} interactive={false} />
          ) : null}
          <CircleMarker center={[store.issueHighlight.lat, store.issueHighlight.lon]} radius={26} pathOptions={{ color: "#ef4444", weight: 3, fillColor: "#ef4444", fillOpacity: 0.15 }} interactive={false} />
          <CircleMarker center={[store.issueHighlight.lat, store.issueHighlight.lon]} radius={5} pathOptions={{ color: "#fff", weight: 2, fillColor: "#ef4444", fillOpacity: 1 }} interactive={false} />
        </>
      ) : null}
      <MapNavigation store={store} />

      {loadedAreaBounds ? (
        <Rectangle bounds={loadedAreaBounds} pathOptions={{ color: "#38bdf8", weight: 1, dashArray: "6 4", fill: false }} interactive={false} />
      ) : null}

      <DrawController key={mode} store={store} />
      <TransformController store={store} />
      <LabelPlanner
        candidates={labelCandidates}
        tagsByKey={labelTagsByKey}
        onPlan={handleLabelPlan}
      />

      {/* B2 sub-order: areas, then lines, then point-like markers, then labels. */}

      {!wireframe
        ? multipolygons.map((mp, i) => {
            const color = classifyAreaColor(mp.tags);
            const isSelected = selection.some((s) => s.type === "relation" && s.id === mp.id);
            return (
              <Polygon
                key={`mp${mp.id}:${i}`}
                positions={mp.rings}
                pathOptions={{ color: isSelected ? HOVER_SELECT_COLOR : color.stroke, weight: isSelected ? 3 : 1, fillColor: color.fill, fillOpacity: 1, opacity: 0.9 }}
                interactive
                eventHandlers={{
                  click: (e) => {
                    if (!interactive) return;
                    L.DomEvent.stopPropagation(e);
                    select({ type: "relation", id: mp.id }, e.originalEvent.shiftKey);
                  },
                }}
              >
                <Tooltip sticky>{tagLabel(mp.tags, `multipolygon #${mp.id}`)}</Tooltip>
              </Polygon>
            );
          })
        : null}

      {areaWays.map((way) => {
        const positions = graph.childNodes(way).map((n) => [n.lat, n.lon] as [number, number]);
        if (positions.length < 3) return null;
        const key = `w${way.id}`;
        const isSelected = selectedWayIds.has(way.id);
        const isHovered = hoveredKey === key && !isSelected;
        const color = classifyAreaColor(way.tags);
        const editState = store.highlightEdits ? classifyEditState(store.serverGraph, way) : null;
        return (
          <div key={key}>
            {isSelected || isHovered ? (
              <Polygon
                positions={positions}
                pathOptions={{
                  color: HOVER_SELECT_COLOR,
                  weight: shadowWidth("narrow", zoom),
                  opacity: isSelected ? SELECTED_OPACITY.line : HOVER_OPACITY.line,
                  fill: false,
                }}
                interactive={false}
              />
            ) : editState ? (
              <Polygon
                positions={positions}
                pathOptions={{ color: EDIT_DIFF_COLORS[editState], weight: shadowWidth("narrow", zoom), opacity: 0.8, fill: false }}
                interactive={false}
              />
            ) : null}
            <Polygon
              positions={positions}
              pathOptions={{ color: color.stroke, weight: 1, fillColor: color.fill, fillOpacity: 1, opacity: 0.9 }}
              interactive
              eventHandlers={{
                click: (e) => {
                  if (!interactive) return;
                  L.DomEvent.stopPropagation(e);
                  selectWay(way, e.originalEvent.shiftKey, { x: e.originalEvent.clientX, y: e.originalEvent.clientY });
                },
                mouseover: () => interactive && setHoveredKey(key),
                mouseout: () => setHoveredKey((k) => (k === key ? null : k)),
              }}
            >
              {isSelected ? null : (
                <Tooltip sticky={!labeledKeys.has(key)} permanent={labeledKeys.has(key)} direction="center" className={labeledKeys.has(key) ? "osm-editor-label" : undefined}>
                  {tagLabel(way.tags, `area #${way.id}`)}
                </Tooltip>
              )}
            </Polygon>
          </div>
        );
      })}

      {lineWays.map((way) => {
        const positions = wayPositions(graph, way);
        if (positions.length < 2) return null;
        const key = `w${way.id}`;
        const isSelected = selectedWayIds.has(way.id);
        return (
          <LineWayView
            key={key}
            way={way}
            positions={positions}
            isSelected={isSelected}
            isHovered={hoveredKey === key && !isSelected}
            zoom={zoom}
            wireframe={wireframe}
            editState={store.highlightEdits ? classifyEditState(store.serverGraph, way) : null}
            labeled={labeledKeys.has(key)}
            interactive={interactive}
            onSelect={selectWayStable}
            onHover={hoverStable}
            onAddNode={addNodeStable}
          />
        );
      })}

      <StackedWaysOverlay graph={graph} />
      <OnewayArrows graph={graph} ways={lineWays} zoom={zoom} />

      {/* Vertices — decluttered per §B3: only "important" ones persist. */}
      {nodes
        .filter((n) => wayNodeIds.has(n.id))
        .map((node) => {
          const key = `n${node.id}`;
          const isSelected = selectedNodeIds.has(node.id);
          const isHovered = hoveredKey === key && !isSelected;
          const isSibling = siblingNodeIds.has(node.id);
          const important = isImportantVertex(graph, node);
          if (!important && !isSelected && !isHovered && !isSibling && !wireframe) return null;

          const junction = graph.parentWays(node.id).length > 1;
          const dangling = isDanglingEndpoint(graph, node);
          const baseRadius = (zoom >= 18 ? 4 : zoom >= 17 ? 3.5 : 3) + (dangling ? 1.5 : 0);
          const radius = isSelected ? baseRadius + 2 : isHovered || isSibling ? baseRadius + 1 : baseRadius;

          return (
            <div key={key}>
              {isSelected || isHovered ? (
                <CircleMarker
                  center={[node.lat, node.lon]}
                  radius={radius + shadowWidth("narrow", zoom) / 2}
                  pathOptions={{
                    color: HOVER_SELECT_COLOR,
                    weight: 0,
                    fillColor: HOVER_SELECT_COLOR,
                    fillOpacity: isSelected ? SELECTED_OPACITY.point : HOVER_OPACITY.point,
                  }}
                  interactive={false}
                />
              ) : null}
              {/* CircleMarker has no drag support — the selected vertex
                  swaps to a real (draggable) Marker so §C5 drag-to-move
                  works; every other vertex stays a plain CircleMarker. */}
              {isSelected && interactive && !!changeset ? (
                <Marker
                  position={[node.lat, node.lon]}
                  icon={vertexDivIcon(radius, junction)}
                  draggable
                  autoPan
                  eventHandlers={{
                    click: (e) => {
                      if (!interactive) return;
                      L.DomEvent.stopPropagation(e);
                      selectNode(node, e.originalEvent.shiftKey, { x: e.originalEvent.clientX, y: e.originalEvent.clientY });
                    },
                    dragend: (e) => handleNodeDragEnd(node, e),
                  }}
                >
                  <Tooltip>{tagLabel(node.tags, `node #${node.id}`)}</Tooltip>
                </Marker>
              ) : (
                <CircleMarker
                  center={[node.lat, node.lon]}
                  radius={radius}
                  pathOptions={{
                    color: "#666",
                    weight: 1.5,
                    fillColor: junction ? "#bbb" : "#000",
                    fillOpacity: 1,
                  }}
                  interactive
                  eventHandlers={{
                    click: (e) => {
                      if (!interactive) return;
                      L.DomEvent.stopPropagation(e);
                      selectNode(node, e.originalEvent.shiftKey, { x: e.originalEvent.clientX, y: e.originalEvent.clientY });
                    },
                    mouseover: () => interactive && setHoveredKey(key),
                    mouseout: () => setHoveredKey((k) => (k === key ? null : k)),
                  }}
                >
                  <Tooltip>{tagLabel(node.tags, `node #${node.id}`)}</Tooltip>
                </CircleMarker>
              )}
            </div>
          );
        })}

      {mode === "select" && interactive && !!changeset ? <Midpoints store={store} promote={promoteMidpoint} /> : null}

      {/* Map notes: pins above the data, below nothing. */}
      {!hiddenSet.has("notes") && store.dataVisible
        ? store.notes.map((note) => {
            const selected = store.selectedNoteId === note.id;
            const first = note.comments[0]?.text ?? "";
            return (
              <Marker
                key={`note${note.id}:${note.status}:${selected}`}
                position={[note.lat, note.lon]}
                icon={noteDivIcon(note.status, selected)}
                zIndexOffset={1000}
                eventHandlers={{
                  click: (e) => {
                    L.DomEvent.stopPropagation(e);
                    store.selectNote(note.id);
                  },
                }}
              >
                <Tooltip direction="top" offset={[0, -28]}>
                  <span className="text-[11px]">
                    Note #{note.id} · {note.status === "closed" ? "resolved" : "open"}
                    {first ? ` — ${first.length > 80 ? first.slice(0, 80) + "…" : first}` : ""}
                  </span>
                </Tooltip>
              </Marker>
            );
          })
        : null}
      {store.noteDraft ? <Marker position={[store.noteDraft.lat, store.noteDraft.lon]} icon={noteDivIcon("draft", true)} zIndexOffset={1100} interactive={false} /> : null}

      {/* Points — standalone nodes belonging to no way. */}
      {nodes
        .filter((n) => !wayNodeIds.has(n.id))
        .map((node) => {
          const key = `n${node.id}`;
          const isSelected = selectedNodeIds.has(node.id);
          const isHovered = hoveredKey === key && !isSelected;
          const asVertex = wireframe;

          if (asVertex) {
            return (
              <CircleMarker
                key={key}
                center={[node.lat, node.lon]}
                radius={4}
                pathOptions={{ color: "#666", weight: 1.5, fillColor: "#000", fillOpacity: 1 }}
                interactive
                eventHandlers={{
                  click: (e) => {
                    if (!interactive) return;
                    L.DomEvent.stopPropagation(e);
                    selectNode(node, e.originalEvent.shiftKey, { x: e.originalEvent.clientX, y: e.originalEvent.clientY });
                  },
                }}
              >
                <Tooltip>{tagLabel(node.tags, `node #${node.id}`)}</Tooltip>
              </CircleMarker>
            );
          }

          const draggable = interactive && isSelected && !!changeset;
          const editState = store.highlightEdits ? classifyEditState(store.serverGraph, node) : null;
          const preset = matchPreset(node.tags, "point");
          return (
            <div key={key}>
              {isSelected || isHovered ? (
                <CircleMarker
                  center={[node.lat, node.lon]}
                  radius={10}
                  pathOptions={{
                    color: HOVER_SELECT_COLOR,
                    weight: 0,
                    fillColor: HOVER_SELECT_COLOR,
                    fillOpacity: isSelected ? SELECTED_OPACITY.point : HOVER_OPACITY.point,
                  }}
                  interactive={false}
                />
              ) : editState ? (
                <CircleMarker
                  center={[node.lat, node.lon]}
                  radius={10}
                  pathOptions={{ color: EDIT_DIFF_COLORS[editState], weight: 0, fillColor: EDIT_DIFF_COLORS[editState], fillOpacity: 0.55 }}
                  interactive={false}
                />
              ) : null}
              <Marker
                position={[node.lat, node.lon]}
                icon={pinDivIcon({ stroke: isSelected ? "#f97316" : "#444", iconGlyphHtml: preset ? presetIconHtml(preset) : "" })}
                draggable={draggable}
                autoPan={draggable}
                interactive
                eventHandlers={{
                  click: (e) => {
                    if (!interactive) return;
                    L.DomEvent.stopPropagation(e);
                    selectNode(node, e.originalEvent.shiftKey, { x: e.originalEvent.clientX, y: e.originalEvent.clientY });
                  },
                  mouseover: () => interactive && setHoveredKey(key),
                  mouseout: () => setHoveredKey((k) => (k === key ? null : k)),
                  dragend: (e) => handleNodeDragEnd(node, e),
                }}
              >
                <Tooltip permanent={labeledKeys.has(key)} direction="right" offset={[10, 0]} className={labeledKeys.has(key) ? "osm-editor-label" : undefined}>
                  {tagLabel(node.tags, `node #${node.id}`)}
                </Tooltip>
              </Marker>
            </div>
          );
        })}
    </MapContainer>
  );
}
