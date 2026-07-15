"use client";

import { useCallback, useEffect, useState } from "react";
import Toast from "@/components/custom/Toast";
import { useToast } from "@/hooks/useToast";
import { fetchMapExplorer } from "../../api";
import type { MapExplorerData } from "../../types";
import MapExplorerSection from "./MapExplorerSection";

export default function MapExplorerPage() {
  const [data, setData] = useState<MapExplorerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { message, visible, showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMapExplorer();
      setData(res);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load map explorer data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleOverlayToggle = useCallback(
    (id: string) => {
      if (!data) return;
      setData({
        ...data,
        overlays: data.overlays.map((o) =>
          o.id === id ? { ...o, enabled: !o.enabled } : o,
        ),
      });
    },
    [data],
  );

  const handleTrustScoreChange = useCallback(
    (value: number) => {
      if (!data) return;
      setData({ ...data, trust_score_range: value });
    },
    [data],
  );

  const handleDataSourceChange = useCallback(
    (value: string) => {
      if (!data) return;
      setData({ ...data, data_source: value });
    },
    [data],
  );

  if (loading)
    return <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Loading...</p>;
  if (error)
    return <p style={{ color: "var(--text-danger)", fontSize: 12 }}>{error}</p>;
  if (!data) return null;

  return (
    <div>
      <MapExplorerSection
        data={data}
        onOverlayToggle={handleOverlayToggle}
        onTrustScoreChange={handleTrustScoreChange}
        onDataSourceChange={handleDataSourceChange}
        onRunAnalysis={() => showToast("Running deep analysis…")}
        onExport={() => showToast("Exporting data…")}
      />
      <Toast message={message} visible={visible} />
    </div>
  );
}