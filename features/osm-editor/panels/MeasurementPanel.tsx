"use client";

import { useMemo } from "react";
import { formatArea, formatLength, measureSelection } from "../lib/measure";
import type { EditorStore } from "../useEditorStore";
import PanelShell from "./PanelShell";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[color:var(--text-muted)]">{label}</span>
      <span className="text-right font-mono text-[11px] text-[color:var(--text-primary)]">{value}</span>
    </div>
  );
}

export default function MeasurementPanel({ store, onClose }: { store: EditorStore; onClose: () => void }) {
  const m = useMemo(() => measureSelection(store.graph, store.selection), [store.graph, store.selection]);
  return (
    <PanelShell title={store.t("panel.measurement")} onClose={onClose}>
      {store.selection.length === 0 ? (
        <div className="text-[color:var(--text-muted)]">Select a feature to measure it.</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <Row label="Selected" value={`${m.features} feature${m.features === 1 ? "" : "s"}`} />
          <Row label="Nodes" value={String(m.nodes)} />
          {m.lengthMeters > 0 ? <Row label="Length / perimeter" value={formatLength(m.lengthMeters)} /> : null}
          {m.areaSquareMeters > 0 ? <Row label="Area" value={formatArea(m.areaSquareMeters)} /> : null}
          {m.center ? <Row label="Center" value={`${m.center.lat.toFixed(6)}, ${m.center.lon.toFixed(6)}`} /> : null}
          {m.bounds ? (
            <Row label="Bounds" value={`${m.bounds.minLat.toFixed(5)}, ${m.bounds.minLon.toFixed(5)} → ${m.bounds.maxLat.toFixed(5)}, ${m.bounds.maxLon.toFixed(5)}`} />
          ) : null}
        </div>
      )}
    </PanelShell>
  );
}
