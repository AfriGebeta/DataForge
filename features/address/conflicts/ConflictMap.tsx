"use client";

import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
// Must run before the geoman import below - see leafletGeomanSetup.ts for why.
import "./leafletGeomanSetup";
import "@geoman-io/leaflet-geoman-free";
import { useEffect, useMemo } from "react";
import { CircleMarker, GeoJSON, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { LatLngBoundsExpression } from "leaflet";

// Composes react-leaflet the same way
// features/ai-analysis/map-explorer/.../OsmMap.tsx does (MapContainer +
// TileLayer + CircleMarker + an imperative fit-bounds effect) - a small,
// separate component rather than a shared/imported one, matching this
// codebase's "duplicated rather than coupled across unrelated features"
// convention for anything below page-level.
//
// Edit support (EditableBoundary below) is a smaller copy of
// features/address/nodes/AddressMap.tsx's own EditableBoundary - added so
// a boundary overlap can be fixed right here instead of forcing a trip to
// the Address map for what's otherwise the same drag-vertices-and-save
// flow.

type ConflictPoint = {
  id: string;
  label: string;
  sublabel?: string;
  lat: number;
  lng: number;
  color: string;
};

type ConflictBoundary = {
  id: string;
  label: string;
  color: string;
  geometry: GeoJSON.Geometry;
};

export type ConflictEditTarget = { id: string; geometry: GeoJSON.Geometry };

type Props = {
  points: ConflictPoint[];
  boundaries?: ConflictBoundary[];
  // When set, the boundary whose id matches renders as an editable
  // (vertex-draggable) layer instead of its normal read-only one, and
  // fires onEditChange with the live shape on every drag.
  editing?: ConflictEditTarget | null;
  onEditChange?: (geometry: GeoJSON.Geometry) => void;
};

function FitBoundsOnChange({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
  }, [bounds, map]);
  return null;
}

// L.GeoJSON.toGeoJSON() can return any of these depending on what the layer
// group wraps - same helper as AddressMap.tsx's firstGeometry.
function firstGeometry(
  collection: GeoJSON.Feature | GeoJSON.FeatureCollection | GeoJSON.GeometryCollection,
): GeoJSON.Geometry | null {
  if (collection.type === "Feature") return collection.geometry;
  if (collection.type === "FeatureCollection") return collection.features[0]?.geometry ?? null;
  if (collection.type === "GeometryCollection") return collection.geometries[0] ?? null;
  return null;
}

function EditableBoundary({
  target,
  color,
  onChange,
}: {
  target: ConflictEditTarget;
  color: string;
  onChange: (geometry: GeoJSON.Geometry) => void;
}) {
  const map = useMap();

  useEffect(() => {
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

    return () => {
      layer.pm.disable();
      map.removeLayer(layer);
    };
    // target.id is a stable key for "which node is being edited" - a new
    // target.geometry reference on every render (e.g. from the parent's
    // own re-fetch) would otherwise tear down and rebuild this layer
    // mid-drag, same reasoning as AddressMap.tsx's EditableBoundary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.id, map]);

  return null;
}

export default function ConflictMap({ points, boundaries = [], editing = null, onEditChange }: Props) {
  const bounds = useMemo<LatLngBoundsExpression | null>(() => {
    // Points always win for the initial center/zoom (a boundary can be a
    // whole borough - hundreds of times bigger than the conflict itself),
    // but still fold boundary extents in so a polygon that pokes outside
    // the flagged point's neighborhood isn't clipped out of view.
    if (points.length === 0 && boundaries.length === 0) return null;

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    for (const p of points) {
      minLat = Math.min(minLat, p.lat);
      maxLat = Math.max(maxLat, p.lat);
      minLng = Math.min(minLng, p.lng);
      maxLng = Math.max(maxLng, p.lng);
    }
    for (const b of boundaries) {
      const layerBounds = L.geoJSON(b.geometry).getBounds();
      if (!layerBounds.isValid()) continue;
      minLat = Math.min(minLat, layerBounds.getSouth());
      maxLat = Math.max(maxLat, layerBounds.getNorth());
      minLng = Math.min(minLng, layerBounds.getWest());
      maxLng = Math.max(maxLng, layerBounds.getEast());
    }

    if (!Number.isFinite(minLat)) return null;
    return [
      [minLat, minLng],
      [maxLat, maxLng],
    ];
  }, [points, boundaries]);

  const center: [number, number] = points.length > 0 ? [points[0].lat, points[0].lng] : [9.03, 38.74];
  const editingBoundary = editing ? boundaries.find((b) => b.id === editing.id) : null;

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        height: editing ? 480 : 320,
        overflow: "hidden",
        transition: "height 0.15s ease",
      }}
    >
      {points.length === 0 && boundaries.length === 0 ? (
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--surface-1)",
            color: "var(--text-muted)",
            fontSize: 12,
            textAlign: "center",
            padding: 16,
          }}
        >
          No coordinates available for either side of this conflict yet.
        </div>
      ) : (
        <MapContainer
          center={center}
          zoom={13}
          bounds={bounds ?? undefined}
          boundsOptions={{ padding: [32, 32], maxZoom: 15 }}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBoundsOnChange bounds={bounds} />
          {boundaries
            .filter((boundary) => boundary.id !== editing?.id)
            .map((boundary) => (
              <GeoJSON
                key={boundary.id}
                data={boundary.geometry}
                pathOptions={{ color: boundary.color, weight: 2, fillColor: boundary.color, fillOpacity: 0.12 }}
              >
                <Popup>
                  <strong>{boundary.label}</strong>
                </Popup>
              </GeoJSON>
            ))}
          {editing && onEditChange ? (
            <EditableBoundary target={editing} color={editingBoundary?.color ?? "#8b5cf6"} onChange={onEditChange} />
          ) : null}
          {points.map((point) => (
            <CircleMarker
              key={point.id}
              center={[point.lat, point.lng]}
              radius={9}
              pathOptions={{ color: "#ffffff", weight: 2, fillColor: point.color, fillOpacity: 0.9 }}
            >
              <Popup>
                <strong>{point.label}</strong>
                {point.sublabel ? (
                  <>
                    <br />
                    {point.sublabel}
                  </>
                ) : null}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}
