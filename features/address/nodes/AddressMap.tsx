"use client";

import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
// Must run before the geoman import below - see leafletGeomanSetup.ts for why.
import "./leafletGeomanSetup";
import "@geoman-io/leaflet-geoman-free";
import { useEffect, useMemo, useRef } from "react";
import { CircleMarker, GeoJSON, MapContainer, Rectangle, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { ADDRESS_LEVEL_FALLBACK_COLOR, addressNodeName } from "./types";
import type { AddressNode } from "./types";

// Composes react-leaflet the same way features/address/conflicts/ConflictMap.tsx
// does - a small, separate component rather than a shared/imported one,
// matching this codebase's "duplicated rather than coupled across unrelated
// features" convention for anything below page-level.
//
// Drawing/editing uses @geoman-io/leaflet-geoman-free (a vanilla Leaflet
// plugin, not a react-leaflet-specific wrapper - it attaches `.pm` directly
// to `L.Map`/`L.Path`/`L.LayerGroup` instances, which sidesteps needing a
// React binding kept up to date with react-leaflet@5/React 19).

export type EditTarget = { nodeId: string; geometry: GeoJSON.Geometry };

type Props = {
  nodes: AddressNode[];
  selectedId: string | null;
  // id -> geometry, or null once fetched-but-absent. Missing key = not
  // fetched yet (falls back to a point dot until it arrives).
  boundaries: Map<string, GeoJSON.Geometry | null>;
  onSelect: (id: string) => void;
  // Add-node flow: enables Geoman's polygon draw tool on the map itself;
  // fires once with the finished shape.
  drawing: boolean;
  onDrawFinished: (geometry: GeoJSON.Geometry) => void;
  // Just-drawn shape shown while the Add Node form is being filled in
  // (the interactive draw layer itself is torn down once drawing ends).
  previewGeometry: GeoJSON.Geometry | null;
  // Edit-boundary flow: renders an editable (vertex-draggable) copy of the
  // target node's geometry in place of its normal read-only layer,
  // reporting the live shape upward on every change.
  editing: EditTarget | null;
  onEditChange: (geometry: GeoJSON.Geometry) => void;
  // "Draw area to load" flow: enables Geoman's rectangle draw tool; fires
  // once with the drawn rectangle's bounds so the page can turn it into a
  // bbox query instead of fetching a whole (possibly huge) level.
  drawingArea: boolean;
  onAreaFinished: (bounds: L.LatLngBounds) => void;
  // The bbox currently applied as a filter, if any - rendered as a dashed
  // overlay so it's clear what's in/out of view while browsing.
  loadedArea: L.LatLngBoundsExpression | null;
  // level -> color, from GET /address-levels (see AddressNodesPage) -
  // replaces what used to be this file's own ADDRESS_LEVEL_COLORS import,
  // so a color picked via the Level filter's management form shows up on
  // the map without a frontend redeploy.
  levelColors: Map<number, string>;
};

const LEVEL_RADIUS: Record<number, number> = { 0: 10, 1: 9, 2: 8, 3: 7, 4: 6, 5: 5, 6: 4 };

function radiusForLevel(level: number | null): number {
  if (level == null) return 6;
  return LEVEL_RADIUS[level] ?? 6;
}

// L.Path.toGeoJSON() returns a single Feature; L.LayerGroup/L.GeoJSON's
// (a superset covering every shape a layer group could contain) also allows
// FeatureCollection/GeometryCollection - handle all three since both the
// draw tool (a single L.Polygon) and the edit layer (an L.GeoJSON group
// wrapping one polygon) funnel through this.
function firstGeometry(
  collection: GeoJSON.Feature | GeoJSON.FeatureCollection | GeoJSON.GeometryCollection,
): GeoJSON.Geometry | null {
  if (collection.type === "Feature") return collection.geometry;
  if (collection.type === "FeatureCollection") return collection.features[0]?.geometry ?? null;
  if (collection.type === "GeometryCollection") return collection.geometries[0] ?? null;
  return null;
}

// Fits/pans the map to whatever should currently be in view: the selected
// node's boundary or point when one is selected, otherwise the full set of
// visible (filtered) nodes. Only depends on [nodes, selectedId] - reads
// boundaries via a ref instead of as a dependency, since boundary polygons
// stream in progressively (one fetch at a time) and refitting the camera on
// every single arrival would make the map jump around constantly. A Level/
// search change or a click is what should move the camera, not a background
// fetch completing.
function FitToView({
  nodes,
  selectedId,
  boundariesRef,
}: {
  nodes: AddressNode[];
  selectedId: string | null;
  boundariesRef: React.RefObject<Map<string, GeoJSON.Geometry | null>>;
}) {
  const map = useMap();

  useEffect(() => {
    const boundaries = boundariesRef.current;
    const selected = selectedId ? nodes.find((n) => n.id === selectedId) : null;

    if (selected) {
      const geom = boundaries.get(selected.id);
      if (geom) {
        const layerBounds = L.geoJSON(geom).getBounds();
        if (layerBounds.isValid()) {
          map.fitBounds(layerBounds, { padding: [40, 40], maxZoom: 15 });
          return;
        }
      }
      if (selected.latitude != null && selected.longitude != null) {
        map.flyTo([selected.latitude, selected.longitude], Math.max(map.getZoom(), 12), { duration: 0.6 });
        return;
      }
    }

    const combined = L.latLngBounds([]);
    for (const node of nodes) {
      const geom = boundaries.get(node.id);
      if (geom) {
        const layerBounds = L.geoJSON(geom).getBounds();
        if (layerBounds.isValid()) {
          combined.extend(layerBounds);
          continue;
        }
      }
      if (node.latitude != null && node.longitude != null) {
        combined.extend([node.latitude, node.longitude]);
      }
    }
    if (combined.isValid()) map.fitBounds(combined, { padding: [40, 40], maxZoom: 13 });
  }, [nodes, selectedId, boundariesRef, map]);

  return null;
}

// Add Node flow: enables Geoman's map-level polygon draw tool while
// `active`, reports the finished shape once, then tears itself down
// (including the raw drawn layer - the finished geometry gets rendered
// separately via `previewGeometry` once drawing ends).
function DrawTool({ active, onFinished }: { active: boolean; onFinished: (geometry: GeoJSON.Geometry) => void }) {
  const map = useMap();

  useEffect(() => {
    if (!active) return;

    map.pm.enableDraw("Polygon", {
      finishOnEnter: true,
      pathOptions: { color: "#ffffff", weight: 2, fillColor: "#8b5cf6", fillOpacity: 0.15 },
    });

    let drawnLayer: L.Layer | null = null;
    function handleCreate(e: { layer: L.Layer }) {
      drawnLayer = e.layer;
      const geojson = (e.layer as L.Polygon).toGeoJSON();
      const geom = firstGeometry(geojson);
      if (geom) onFinished(geom);
    }
    map.on("pm:create", handleCreate as never);

    return () => {
      map.off("pm:create", handleCreate as never);
      if (map.pm.globalDrawModeEnabled()) map.pm.disableDraw("Polygon");
      if (drawnLayer) map.removeLayer(drawnLayer);
    };
  }, [active, map, onFinished]);

  return null;
}

// "Draw area to load" flow: enables Geoman's rectangle draw tool while
// `active`, reports the drawn rectangle's bounds once, then tears itself
// down - mirrors DrawTool above, but a Rectangle (not a Polygon) since the
// backend only supports a lat/lng envelope filter, not an arbitrary shape.
function LoadAreaTool({ active, onFinished }: { active: boolean; onFinished: (bounds: L.LatLngBounds) => void }) {
  const map = useMap();

  useEffect(() => {
    if (!active) return;

    map.pm.enableDraw("Rectangle", {
      pathOptions: { color: "#38bdf8", weight: 2, dashArray: "6 4", fillColor: "#38bdf8", fillOpacity: 0.08 },
    });

    let drawnLayer: L.Layer | null = null;
    function handleCreate(e: { layer: L.Layer }) {
      drawnLayer = e.layer;
      onFinished((e.layer as L.Rectangle).getBounds());
    }
    map.on("pm:create", handleCreate as never);

    return () => {
      map.off("pm:create", handleCreate as never);
      if (map.pm.globalDrawModeEnabled()) map.pm.disableDraw("Rectangle");
      if (drawnLayer) map.removeLayer(drawnLayer);
    };
  }, [active, map, onFinished]);

  return null;
}

// Edit-boundary flow: adds a standalone editable (vertex-draggable) copy of
// `target`'s geometry on top of the map, reporting the live shape upward
// via onChange on every edit so the parent's Save button always has the
// latest draft. Removed on unmount/target change - Cancel and Save both
// just clear `editing` in the parent, no explicit revert needed since the
// normal read-only layer for that node re-renders from its own cached
// geometry (unchanged until Save actually persists something new).
function EditableBoundary({
  target,
  color,
  onChange,
}: {
  target: EditTarget | null;
  color: string;
  onChange: (geometry: GeoJSON.Geometry) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;

    const layer = L.geoJSON(target.geometry, {
      style: { color: "#ffffff", weight: 3, fillColor: color, fillOpacity: 0.25 },
    }).addTo(map);

    function reportChange() {
      const geom = firstGeometry(layer.toGeoJSON());
      if (geom) onChange(geom);
    }

    layer.pm.enable({ allowSelfIntersection: false });
    layer.on("pm:edit", reportChange);
    layer.on("pm:markerdragend", reportChange);
    layer.on("pm:vertexadded", reportChange);
    layer.on("pm:vertexremoved", reportChange);

    const bounds = layer.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });

    return () => {
      layer.pm.disable();
      map.removeLayer(layer);
    };
    // target is a one-shot snapshot taken when editing starts; re-running
    // this whenever onChange/color's identity changes would tear down the
    // layer mid-edit, discarding in-progress vertex drags.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, map]);

  return null;
}

export default function AddressMap({
  nodes,
  selectedId,
  boundaries,
  onSelect,
  drawing,
  onDrawFinished,
  previewGeometry,
  editing,
  onEditChange,
  drawingArea,
  onAreaFinished,
  loadedArea,
  levelColors,
}: Props) {
  const boundariesRef = useRef(boundaries);
  useEffect(() => {
    boundariesRef.current = boundaries;
  }, [boundaries]);

  function colorForLevel(level: number | null): string {
    if (level == null) return ADDRESS_LEVEL_FALLBACK_COLOR;
    return levelColors.get(level) ?? ADDRESS_LEVEL_FALLBACK_COLOR;
  }

  // Renderable = has a boundary polygon OR a plottable point. Selected node
  // drawn last so its polygon/marker renders above its neighbors. The node
  // currently being reshaped is skipped entirely - EditableBoundary renders
  // its live editable copy instead.
  const ordered = useMemo(() => {
    const renderable = nodes.filter(
      (n) => n.id !== editing?.nodeId && (boundaries.get(n.id) || (n.latitude != null && n.longitude != null)),
    );
    if (!selectedId) return renderable;
    const selectedIndex = renderable.findIndex((n) => n.id === selectedId);
    if (selectedIndex < 0) return renderable;
    const reordered = renderable.slice();
    const [selected] = reordered.splice(selectedIndex, 1);
    reordered.push(selected);
    return reordered;
  }, [nodes, boundaries, selectedId, editing]);

  const editingNode = editing ? nodes.find((n) => n.id === editing.nodeId) ?? null : null;

  return (
    <MapContainer
      center={[9.03, 38.74]}
      zoom={6}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToView nodes={nodes} selectedId={selectedId} boundariesRef={boundariesRef} />
      <DrawTool active={drawing} onFinished={onDrawFinished} />
      <LoadAreaTool active={drawingArea} onFinished={onAreaFinished} />
      <EditableBoundary target={editing} color={colorForLevel(editingNode?.level ?? null)} onChange={onEditChange} />
      {loadedArea ? (
        <Rectangle
          bounds={loadedArea}
          pathOptions={{ color: "#38bdf8", weight: 1.5, dashArray: "6 4", fill: false }}
          interactive={false}
        />
      ) : null}
      {previewGeometry ? (
        <GeoJSON
          data={previewGeometry}
          pathOptions={{ color: "#ffffff", weight: 2, dashArray: "6 4", fillColor: "#8b5cf6", fillOpacity: 0.15 }}
        />
      ) : null}
      {ordered.map((node) => {
        const isSelected = node.id === selectedId;
        const geom = boundaries.get(node.id);
        const color = colorForLevel(node.level);

        if (geom) {
          return (
            <GeoJSON
              key={node.id}
              data={geom}
              pathOptions={{
                // White read fine against the old dark basemap but is
                // nearly invisible on this light OSM tile layer - use the
                // level's own color for the outline instead (still
                // brightened via opacity for the selected node so it reads
                // as "picked" rather than just "another polygon").
                color: color,
                opacity: isSelected ? 1 : 0.85,
                weight: isSelected ? 3.5 : 2,
                fillColor: color,
                fillOpacity: isSelected ? 0.35 : 0.12,
              }}
              eventHandlers={{ click: () => onSelect(node.id) }}
            >
              <Tooltip direction="center" opacity={0.95} sticky>
                {addressNodeName(node)}
              </Tooltip>
            </GeoJSON>
          );
        }

        return (
          <CircleMarker
            key={node.id}
            center={[node.latitude as number, node.longitude as number]}
            radius={isSelected ? radiusForLevel(node.level) + 3 : radiusForLevel(node.level)}
            pathOptions={{
              color: isSelected ? "#ffffff" : "rgba(255,255,255,0.55)",
              weight: isSelected ? 3 : 1.5,
              fillColor: color,
              fillOpacity: isSelected ? 1 : 0.8,
            }}
            eventHandlers={{ click: () => onSelect(node.id) }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
              {addressNodeName(node)}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
