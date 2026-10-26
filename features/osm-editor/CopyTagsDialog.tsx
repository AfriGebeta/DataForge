"use client";

// Copy tags… with several features selected: pick which of the first
// feature's tags to copy onto the rest (the Gebeta iD fork asks for a key
// with window.prompt; this lets you tick several). With a single feature
// selected, the operation instead waits for you to click the target.

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import * as graphActions from "./lib/actions";
import type { EditorStore } from "./useEditorStore";

export default function CopyTagsDialog({ store, onClose }: { store: EditorStore; onClose: () => void }) {
  const source = store.selection[0] ? store.graph.get(store.selection[0].type, store.selection[0].id) : undefined;
  const targets = store.selection.slice(1);
  const keys = source ? Object.keys(source.tags) : [];
  const [picked, setPicked] = useState<Set<string>>(() => new Set(keys));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!source) return null;

  function apply() {
    if (!source) return;
    let g = store.graph;
    for (const t of targets) {
      const e = g.get(t.type, t.id);
      if (!e) continue;
      const tags = { ...e.tags };
      for (const k of picked) tags[k] = source.tags[k];
      g = graphActions.changeTags(g, t.type, t.id, tags);
    }
    store.commitGraph(g);
    store.flash(`Copied ${picked.size} tag${picked.size === 1 ? "" : "s"} onto ${targets.length} feature${targets.length === 1 ? "" : "s"}`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[1200] flex items-start justify-center bg-black/40 p-4 pt-24" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-96 max-w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4 text-[12px] shadow-2xl">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[color:var(--text-primary)]">Copy tags</span>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-[color:var(--text-muted)] transition hover:bg-[color:var(--surface-3)]">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mb-2 text-[11px] text-[color:var(--text-muted)]">
          From {source.type} #{source.id} onto {targets.length} other feature{targets.length === 1 ? "" : "s"}. Existing values of the same key are replaced.
        </div>
        <div className="flex max-h-60 flex-col gap-1 overflow-y-auto rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] p-2">
          {keys.map((k) => (
            <label key={k} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={picked.has(k)}
                onChange={() =>
                  setPicked((prev) => {
                    const next = new Set(prev);
                    if (next.has(k)) next.delete(k);
                    else next.add(k);
                    return next;
                  })
                }
              />
              <span className="text-[color:var(--text-muted)]">{k}</span>
              <span className="truncate text-[color:var(--text-primary)]">= {source.tags[k]}</span>
            </label>
          ))}
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1.5 text-[12px] hover:bg-[color:var(--surface-3)]">
            Cancel
          </button>
          <button
            type="button"
            disabled={picked.size === 0}
            onClick={apply}
            className="rounded-lg border border-[color:var(--orange-400)]/30 bg-[color:var(--orange-500)]/12 px-3 py-1.5 text-[12px] font-medium text-[color:var(--orange-400)] hover:bg-[color:var(--orange-500)]/20 disabled:opacity-40"
          >
            Copy {picked.size} tag{picked.size === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </div>
  );
}
