"use client";

import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, Marker, Polygon, Polyline, Rectangle, TileLayer, Tooltip, useMap, useMapEvent } from "react-leaflet";
import L from "leaflet";
import type { EditorStore } from "./useEditorStore";
import * as graphActions from "./lib/actions";
import { wouldSelfIntersect } from "./lib/drawing";
import { classifyEditState } from "./lib/editState";
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
import { midpointDivIcon, pinDivIcon, presetIconHtml, vertexDivIcon } from "./lib/mapIcons";
import { matchPreset } from "./lib/presets";
import type { Graph, NodeEntity, OsmTags, WayEntity } from "./lib/graph";
import DrawController from "./DrawController";

// Composes react-leaflet directly against the graph/store — Geoman is
// no longer the interaction driver here (see map-editor-full-spec.md's
// plan: exact click-vs-drag/snap/self-intersection mechanics aren't
// expressible through Geoman's high-level enableDraw() API). Draw/drag
// pointer handling is layered on top of this render in later phases;
// `features/address/nodes/` keeps its own separate Geoman setup
// untouched.

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
function MapRefCapture({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

// A true background click (every entity layer stops propagation on its
// own click) deselects in Select mode — clicking empty space is the
// mechanism for "replace selection with nothing" (§C8).
function BackgroundClick({ mode, clearSelection }: { mode: EditorStore["mode"]; clearSelection: () => void }) {
  useMapEvent("click", () => {
    if (mode === "select") clearSelection();
  });
  return null;
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
  const interactive = zoom >= store.minEditZoom && (mode === "browse" || mode === "select");

  const ways = useMemo(() => graph.visibleWays(), [graph]);
  const nodes = useMemo(() => graph.visibleNodes(), [graph]);

  const { areaWays, lineWays } = useMemo(() => {
    const areaWays: WayEntity[] = [];
    const lineWays: WayEntity[] = [];
    for (const w of ways) (wayRole(w) === "area" && !wireframe ? areaWays : lineWays).push(w);
    return { areaWays, lineWays };
  }, [ways, wireframe]);

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

  function selectWay(way: WayEntity, shift: boolean, anchor: { x: number; y: number }) {
    select({ type: "way", id: way.id }, shift, anchor);
  }
  function selectNode(node: NodeEntity, shift: boolean, anchor: { x: number; y: number }) {
    select({ type: "node", id: node.id }, shift, anchor);
  }

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

  // react-leaflet doesn't reliably re-apply a Path/Marker's `interactive`
  // constructor option on prop updates (it's baked in at layer creation,
  // not treated as a live style like pathOptions is) — so toggling the
  // `interactive` prop alone leaves already-mounted ways/nodes clickable
  // even after switching into a draw mode. Enforced instead via a CSS
  // pointer-events override toggled directly on the map container's DOM
  // node (see DrawingClassToggle), which works regardless of when each
  // layer was created.
  const drawingActive = mode === "drawPoint" || mode === "drawLine" || mode === "drawArea";

  return (
    <MapContainer center={[9.03, 38.74]} zoom={14} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
      <style>{`
        .osm-editor-drawing .leaflet-interactive, .osm-editor-drawing .leaflet-marker-icon { pointer-events: none !important; }
        .osm-editor-label {
          background: transparent; border: none; box-shadow: none; padding: 0;
          font-size: 11px; font-weight: 600; color: #222;
          text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 0 3px #fff;
          pointer-events: none;
        }
        .osm-editor-label::before { display: none; }
      `}</style>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomTracker onZoom={setZoom} />
      <ViewTracker registerBoundsGetter={registerBoundsGetter} />
      <MapRefCapture mapRef={mapRef} />
      <DrawingClassToggle active={drawingActive} />
      <BackgroundClick mode={mode} clearSelection={store.clearSelection} />

      {loadedAreaBounds ? (
        <Rectangle bounds={loadedAreaBounds} pathOptions={{ color: "#38bdf8", weight: 1, dashArray: "6 4", fill: false }} interactive={false} />
      ) : null}

      <DrawController key={mode} store={store} />
      <LabelPlanner
        candidates={labelCandidates}
        tagsByKey={labelTagsByKey}
        onPlan={handleLabelPlan}
      />

      {/* B2 sub-order: areas, then lines, then point-like markers, then labels. */}

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
              interactive={interactive}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e);
                  selectWay(way, e.originalEvent.shiftKey, { x: e.originalEvent.clientX, y: e.originalEvent.clientY });
                },
                mouseover: () => setHoveredKey(key),
                mouseout: () => setHoveredKey((k) => (k === key ? null : k)),
              }}
            >
              <Tooltip sticky={!labeledKeys.has(key)} permanent={labeledKeys.has(key)} direction="center" className={labeledKeys.has(key) ? "osm-editor-label" : undefined}>
                {tagLabel(way.tags, `area #${way.id}`)}
              </Tooltip>
            </Polygon>
          </div>
        );
      })}

      {lineWays.map((way) => {
        const positions = graph.childNodes(way).map((n) => [n.lat, n.lon] as [number, number]);
        if (positions.length < 2) return null;
        const key = `w${way.id}`;
        const isSelected = selectedWayIds.has(way.id);
        const isHovered = hoveredKey === key && !isSelected;
        const style = wireframe ? DEFAULT_LINE_STYLE : resolveLineStyle(way.tags);
        const w = widthAt(style.widths, zoom);
        // §3.5: a proposed (not-yet-built) road/path renders noticeably
        // thinner than the same tag once actually built.
        const proposed = !wireframe && isProposed(way.tags);
        if (proposed) {
          w.casing *= 0.6;
          w.stroke *= 0.6;
        }
        const editState = store.highlightEdits ? classifyEditState(store.serverGraph, way) : null;
        return (
          <div key={key}>
            {isSelected || isHovered ? (
              <Polyline
                positions={positions}
                pathOptions={{
                  color: HOVER_SELECT_COLOR,
                  weight: shadowWidth(style.wide ? "wide" : "narrow", zoom),
                  opacity: isSelected ? SELECTED_OPACITY.line : HOVER_OPACITY.line,
                }}
                interactive={false}
              />
            ) : editState ? (
              <Polyline
                positions={positions}
                pathOptions={{ color: EDIT_DIFF_COLORS[editState], weight: shadowWidth(style.wide ? "wide" : "narrow", zoom), opacity: 0.8 }}
                interactive={false}
              />
            ) : null}
            {style.casing ? (
              <Polyline positions={positions} pathOptions={{ color: style.casing, weight: w.casing, opacity: 1 }} interactive={false} />
            ) : null}
            <Polyline
              positions={positions}
              pathOptions={{ color: style.stroke, weight: w.stroke, opacity: 1, dashArray: proposed ? "4,4" : style.strokeDash }}
              interactive={interactive}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e);
                  selectWay(way, e.originalEvent.shiftKey, { x: e.originalEvent.clientX, y: e.originalEvent.clientY });
                },
                mouseover: () => setHoveredKey(key),
                mouseout: () => setHoveredKey((k) => (k === key ? null : k)),
              }}
            >
              <Tooltip sticky={!labeledKeys.has(key)} permanent={labeledKeys.has(key)} direction="center" className={labeledKeys.has(key) ? "osm-editor-label" : undefined}>
                {tagLabel(way.tags, `way #${way.id}`)}
              </Tooltip>
            </Polyline>
          </div>
        );
      })}

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
                  interactive={interactive}
                  eventHandlers={{
                    click: (e) => {
                      L.DomEvent.stopPropagation(e);
                      selectNode(node, e.originalEvent.shiftKey, { x: e.originalEvent.clientX, y: e.originalEvent.clientY });
                    },
                    mouseover: () => setHoveredKey(key),
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
                interactive={interactive}
                eventHandlers={{
                  click: (e) => {
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
                interactive={interactive}
                eventHandlers={{
                  click: (e) => {
                    L.DomEvent.stopPropagation(e);
                    selectNode(node, e.originalEvent.shiftKey, { x: e.originalEvent.clientX, y: e.originalEvent.clientY });
                  },
                  mouseover: () => setHoveredKey(key),
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
