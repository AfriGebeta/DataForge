"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "../../../types";

// Leaflet touches `window` at module load time, which crashes during Next's
// server render of this "use client" tree — load the actual map client-only.
const OsmMap = dynamic(() => import("./OsmMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        height: 320,
        marginBottom: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--surface-1)",
        color: "var(--text-muted)",
        fontSize: 12,
      }}
    >
      Loading map…
    </div>
  ),
});

function dotColor(point: MapPoint): string {
  if (point.ai_decision === "DUPLICATE") return "var(--text-danger)";
  if ((point.ai_overall_score ?? 100) < 50) return "var(--text-warning)";
  if (point.review_status === "NEEDS_REVIEW") return "var(--text-accent)";
  return "var(--text-success)";
}

type Props = {
  points: MapPoint[];
  selectedId: number | null;
  onSelect: (id: number) => void;
};

export default function MapCanvas({ points, selectedId, onSelect }: Props) {
  const selected = points.find((p) => p.place_id === selectedId) ?? null;

  return (
    <div style={{ position: "relative" }}>
      <OsmMap points={points} selectedId={selectedId} onSelect={onSelect} />

      {selected && (
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 10,
            zIndex: 1000,
            background: "var(--surface-1)",
            border: "1px solid var(--border-strong)",
            borderRadius: 8,
            padding: "10px 12px",
            minWidth: 180,
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 5,
              gap: 8,
            }}
          >
            <strong style={{ fontSize: 11 }}>
              {selected.name ?? `Place #${selected.place_id}`}
            </strong>
            {selected.ai_decision === "DUPLICATE" && (
              <i className="ti ti-alert-triangle" style={{ color: "var(--text-warning)", fontSize: 12 }} />
            )}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
            {selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span>Trust Score</span>
            <strong style={{ color: dotColor(selected) }}>
              {selected.ai_overall_score != null ? selected.ai_overall_score : "—"}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
}
