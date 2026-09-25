"use client";

// Discoverable keyboard-shortcuts reference — map-editor-full-spec.md
// §1.12. Purely informational; the shortcuts themselves are already
// live (useEditorStore.ts, DrawController.tsx) regardless of whether
// this panel has ever been opened.

import { useEffect } from "react";
import { X } from "lucide-react";

const SHORTCUTS: { keys: string; description: string }[] = [
  { keys: "Ctrl/Cmd + Z", description: "Undo" },
  { keys: "Ctrl/Cmd + Shift + Z", description: "Redo" },
  { keys: "Escape", description: "Deselect, or cancel the current draw" },
  { keys: "Delete / Backspace", description: "Delete the current selection" },
  { keys: "Shift + click", description: "Add/remove a feature from the selection" },
  { keys: "Enter", description: "Finish the current line/area draw" },
  { keys: "Backspace (while drawing)", description: "Remove the last placed point" },
  { keys: "Click the start point", description: "Close a line into an area" },
  { keys: "Alt + click (while drawing)", description: "Override the self-intersection guard" },
];

export default function ShortcutsPanel({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40 p-4">
      <div className="w-96 max-w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4 text-[12px] shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[color:var(--text-primary)]">Keyboard shortcuts</span>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-[color:var(--text-muted)] transition hover:bg-[color:var(--surface-3)]">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex items-center justify-between gap-3">
              <span className="text-[color:var(--text-secondary)]">{s.description}</span>
              <kbd className="shrink-0 rounded border border-[color:var(--border)] bg-[color:var(--surface-1)] px-1.5 py-0.5 text-[10px] text-[color:var(--text-primary)]">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
