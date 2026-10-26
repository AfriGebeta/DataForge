"use client";

import { FEATURE_CATEGORIES } from "../lib/featureFilters";
import type { EditorStore } from "../useEditorStore";
import PanelShell from "./PanelShell";

export default function MapDataPanel({ store, onClose }: { store: EditorStore; onClose: () => void }) {
  const hidden = new Set(store.hiddenFeatures);
  return (
    <PanelShell title={store.t("panel.mapData")} onClose={onClose}>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">Show features</div>
      <div className="flex flex-col gap-1">
        {FEATURE_CATEGORIES.map((c) => (
          <label key={c.id} className="flex items-center gap-2 text-[12px] text-[color:var(--text-primary)]">
            <input type="checkbox" checked={!hidden.has(c.id)} onChange={() => store.toggleFeature(c.id)} />
            {c.label}
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={store.showAllFeatures}
        disabled={hidden.size === 0}
        className="self-start rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-2 py-1 text-[11px] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-3)] disabled:opacity-40"
      >
        Show all
      </button>
      <div className="text-[10px] text-[color:var(--text-muted)]">Hiding only affects what you see. Anything selected or edited this session always stays visible.</div>

      <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">Display</div>
      <label className="flex items-center gap-2 text-[12px] text-[color:var(--text-primary)]">
        <input type="checkbox" checked={store.wireframe} onChange={() => store.setWireframe(!store.wireframe)} />
        Wireframe (lines only, no fills)
      </label>
      <label className="flex items-center gap-2 text-[12px] text-[color:var(--text-primary)]">
        <input type="checkbox" checked={store.highlightEdits} onChange={() => store.setHighlightEdits(!store.highlightEdits)} />
        Highlight my edits
      </label>
    </PanelShell>
  );
}
