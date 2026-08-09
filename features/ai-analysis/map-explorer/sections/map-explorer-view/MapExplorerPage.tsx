"use client";

import { useCallback, useState } from "react";
import Toast from "@/components/custom/Toast";
import { useToast } from "@/hooks/useToast";
import { fakeData } from "../../api";
import type { MapExplorerData } from "../../types";
import MapExplorerSection from "./MapExplorerSection";

export default function MapExplorerPage() {
  const [data, setData] = useState<MapExplorerData>(fakeData);
  const { message, visible, showToast } = useToast();

  const handleOverlayToggle = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      overlays: d.overlays.map((o) =>
        o.id === id ? { ...o, enabled: !o.enabled } : o,
      ),
    }));
  }, []);

  const handleTrustScoreChange = useCallback((value: number) => {
    setData((d) => ({ ...d, trust_score_range: value }));
  }, []);

  const handleDataSourceChange = useCallback((value: string) => {
    setData((d) => ({ ...d, data_source: value }));
  }, []);

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
