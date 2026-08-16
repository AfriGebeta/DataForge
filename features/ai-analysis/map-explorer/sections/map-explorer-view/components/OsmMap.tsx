"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, useMap } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import type { MapPoint } from "../../../types";

type Props = {
  points: MapPoint[];
  selectedId: number | null;
  onSelect: (id: number) => void;
};

function dotColor(point: MapPoint): string {
  if (point.ai_decision === "DUPLICATE") return "#ef4444";
  if ((point.ai_overall_score ?? 100) < 50) return "#f59e0b";
  if (point.review_status === "NEEDS_REVIEW") return "#3b82f6";
  return "#22c55e";
}

// Reframes the view whenever the filtered point set changes — react-leaflet
// only reads `bounds` on first mount, so a later filter change (overlay
// toggle, trust slider) needs an imperative fitBounds() to actually move.
function FitBoundsOnChange({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [24, 24], maxZoom: 16 });
  }, [bounds, map]);
  return null;
}

export default function OsmMap({ points, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const bounds = useMemo<LatLngBoundsExpression | null>(() => {
    if (points.length === 0) return null;
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];
  }, [points]);

  const center: [number, number] = points.length > 0 ? [points[0].lat, points[0].lng] : [9.03, 38.74];

  return (
    <div
      ref={containerRef}
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        height: 320,
        overflow: "hidden",
        marginBottom: 12,
      }}
    >
      {points.length === 0 ? (
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
          No places match the current filters.
        </div>
      ) : (
        <MapContainer
          center={center}
          zoom={13}
          bounds={bounds ?? undefined}
          boundsOptions={{ padding: [24, 24], maxZoom: 16 }}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBoundsOnChange bounds={bounds} />
          {points.map((point) => {
            const isSelected = point.place_id === selectedId;
            return (
              <CircleMarker
                key={point.place_id}
                center={[point.lat, point.lng]}
                radius={isSelected ? 8 : 6}
                pathOptions={{
                  color: isSelected ? "#ffffff" : dotColor(point),
                  weight: isSelected ? 2 : 1,
                  fillColor: dotColor(point),
                  fillOpacity: 0.9,
                }}
                eventHandlers={{ click: () => onSelect(point.place_id) }}
              />
            );
          })}
        </MapContainer>
      )}
    </div>
  );
}
