"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import type { InformalArea } from "./types";
import { informalAreaName } from "./types";

// Plain marker map, no Geoman - unlike ../nodes/AddressMap.tsx and
// ../conflicts/ConflictMap.tsx, an informal area is just a fixed point (see
// InformalArea in PlaceForge's core.prisma), never a polygon, so there's
// nothing here to draw/edit. Same shape as
// features/ai-analysis/map-explorer/.../OsmMap.tsx's plain-marker map.

type Props = {
  areas: InformalArea[];
  selectedId: string | null;
  onSelect?: (id: string) => void;
};

function FitBoundsOnChange({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
  }, [bounds, map]);
  return null;
}

export default function InformalAreaMap({ areas, selectedId, onSelect }: Props) {
  const bounds = useMemo<LatLngBoundsExpression | null>(() => {
    if (areas.length === 0) return null;
    const lats = areas.map((a) => a.latitude);
    const lngs = areas.map((a) => a.longitude);
    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];
  }, [areas]);

  const center: [number, number] = areas.length > 0 ? [areas[0].latitude, areas[0].longitude] : [9.03, 38.74];

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 12, height: 320, overflow: "hidden" }}>
      {areas.length === 0 ? (
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--surface-1)",
            color: "var(--text-muted)",
            fontSize: 12,
          }}
        >
          No informal areas yet.
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
          {areas.map((area) => {
            const isSelected = area.id === selectedId;
            return (
              <CircleMarker
                key={area.id}
                center={[area.latitude, area.longitude]}
                radius={isSelected ? 9 : 7}
                pathOptions={{
                  color: "#ffffff",
                  weight: isSelected ? 3 : 2,
                  fillColor: "#a855f7",
                  fillOpacity: 0.9,
                }}
                eventHandlers={onSelect ? { click: () => onSelect(area.id) } : undefined}
              >
                <Popup>
                  <strong>{informalAreaName(area)}</strong>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      )}
    </div>
  );
}
