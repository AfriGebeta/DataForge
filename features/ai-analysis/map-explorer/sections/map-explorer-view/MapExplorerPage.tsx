"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchMapExplorer } from "../../api";
import type { MapExplorerData, MapPoint } from "../../types";
import MapExplorerSection from "./MapExplorerSection";

export type OverlayId = "needs_review" | "low_trust" | "duplicate";

const OVERLAYS: { id: OverlayId; label: string; dot_class: string }[] = [
  { id: "needs_review", label: "Needs Review", dot_class: "dw" },
  { id: "low_trust", label: "Low Trust (<50)", dot_class: "dd" },
  { id: "duplicate", label: "AI-flagged Duplicate", dot_class: "db" },
];

function matchesOverlay(point: MapPoint, overlay: OverlayId): boolean {
  if (overlay === "needs_review") return point.review_status === "NEEDS_REVIEW";
  if (overlay === "low_trust") return (point.ai_overall_score ?? 100) < 50;
  return point.ai_decision === "DUPLICATE";
}

export default function MapExplorerPage() {
  const [data, setData] = useState<MapExplorerData | null>(null);
  const [enabledOverlays, setEnabledOverlays] = useState<Set<OverlayId>>(new Set());
  const [minTrustScore, setMinTrustScore] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMapExplorer()
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setSelectedId(res.points[0]?.place_id ?? null);
      })
      .catch((cause) => console.warn("fetchMapExplorer failed:", cause));
    return () => {
      cancelled = true;
    };
  }, []);

  const handleOverlayToggle = useCallback((id: OverlayId) => {
    setEnabledOverlays((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const filteredPoints = useMemo(() => {
    if (!data) return [];
    return data.points.filter((p) => {
      if ((p.ai_overall_score ?? 0) < minTrustScore) return false;
      if (enabledOverlays.size === 0) return true;
      return Array.from(enabledOverlays).some((o) => matchesOverlay(p, o));
    });
  }, [data, enabledOverlays, minTrustScore]);

  const handleExport = useCallback(() => {
    const rows = [
      ["place_id", "name", "lat", "lng", "ai_overall_score", "ai_decision", "review_status"],
      ...filteredPoints.map((p) => [
        p.place_id,
        p.name ?? "",
        p.lat,
        p.lng,
        p.ai_overall_score ?? "",
        p.ai_decision ?? "",
        p.review_status,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "map-explorer-points.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredPoints]);

  if (!data) return null;

  return (
    <MapExplorerSection
      data={data}
      overlays={OVERLAYS}
      enabledOverlays={enabledOverlays}
      onOverlayToggle={handleOverlayToggle}
      minTrustScore={minTrustScore}
      onTrustScoreChange={setMinTrustScore}
      points={filteredPoints}
      selectedId={selectedId}
      onSelect={setSelectedId}
      onExport={handleExport}
    />
  );
}
