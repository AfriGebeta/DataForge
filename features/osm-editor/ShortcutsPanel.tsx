"use client";

// Keyboard shortcuts reference (? or H) — organized like iD's: Browsing,
// Editing, Tools. Every binding listed here is live (shortcuts.ts for
// navigation/panels, selectionOps.ts for operations, DrawController.tsx
// for drawing, useEditorStore.ts for undo/redo/Esc).

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageKey } from "./lib/i18n";

type Tab = "browsing" | "editing" | "tools";

interface Row {
  keys: string[]; // alternatives are shown with "or"
  text: string;
}
interface Section {
  title: string;
  rows: Row[];
}

// "⌘" on Apple platforms, "Ctrl" elsewhere.
function useCmd(): string {
  const [cmd] = useState(() => (typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.platform) ? "⌘" : "Ctrl"));
  return cmd;
}

function catalog(c: string): Record<Tab, Section[]> {
  return {
    browsing: [
      {
        title: "Navigation",
        rows: [
          { keys: ["← ↑ → ↓"], text: "Pan the map" },
          { keys: ["Alt + ← ↑ → ↓"], text: "Pan a full screen" },
          { keys: ["+", "−"], text: "Zoom in / out" },
          { keys: ["Alt + +", "Alt + −"], text: "Zoom four levels" },
          { keys: [`${c} + G`], text: "Go to lat/lng, tile z/x/y or bounds" },
          { keys: [`${c} + F`], text: "Search features, coordinates, tiles and ids" },
        ],
      },
      {
        title: "Display",
        rows: [
          { keys: ["B"], text: "Background imagery" },
          { keys: [`${c} + B`], text: "Switch to the previous background" },
          { keys: ["U"], text: "Map data (show / hide feature types)" },
          { keys: ["I"], text: "Issues" },
          { keys: ["P"], text: "Preferences" },
          { keys: ["W"], text: "Wireframe" },
          { keys: ["Alt + W"], text: "Show / hide all map data" },
          { keys: ["G"], text: "Highlight my edits" },
          { keys: ["/"], text: "Show / hide the minimap" },
          { keys: ["Shift + P"], text: "Street-level photos here (opens Mapillary)" },
          { keys: ["`"], text: "Show / hide the sidebar" },
          { keys: [`${c} + I`], text: "Show / hide the coordinates bar" },
          { keys: ["⌃ + ⌘ + F"], text: "Full screen" },
        ],
      },
      {
        title: "Selecting",
        rows: [
          { keys: ["Click", "Space"], text: "Select the feature under the pointer" },
          { keys: ["Shift + click"], text: "Add or remove from the selection" },
          { keys: ["Right-click"], text: "Open the edit menu" },
          { keys: ["Z"], text: "Zoom to the selection" },
          { keys: ["[", "PgUp"], text: "Previous vertex on the way" },
          { keys: ["]", "PgDn"], text: "Next vertex on the way" },
          { keys: ["{", "Home"], text: "First vertex" },
          { keys: ["}", "End"], text: "Last vertex" },
          { keys: [`${c} + ↑`], text: "Select the parent way / relation" },
          { keys: [`${c} + ↓`], text: "Select the child vertex / members" },
          { keys: ["\\"], text: "Switch which way [ and ] follow" },
        ],
      },
      {
        title: "Help",
        rows: [{ keys: ["?", "H"], text: "This keyboard reference" }],
      },
    ],
    editing: [
      {
        title: "Drawing",
        rows: [
          { keys: ["1"], text: "Add a point" },
          { keys: ["2"], text: "Add a line" },
          { keys: ["3"], text: "Add an area" },
          { keys: ["N"], text: "Add a note (no editing session needed)" },
          { keys: ["Click", "Space"], text: "Place a point at the pointer" },
          { keys: ["Alt"], text: "Hold to disable snapping" },
          { keys: ["Enter", "Esc"], text: "Finish the line or area" },
          { keys: ["F"], text: "Follow: walk along an existing way to the vertex under the pointer" },
          { keys: ["Backspace"], text: "Remove the last placed point" },
        ],
      },
      {
        title: "Commands",
        rows: [
          { keys: [`${c} + C`], text: "Copy" },
          { keys: [`${c} + V`], text: "Paste at the pointer" },
          { keys: [`${c} + Z`], text: "Undo" },
          { keys: [`${c} + Shift + Z`, `${c} + Y`], text: "Redo" },
          { keys: [`${c} + S`], text: "Save" },
          { keys: ["Esc"], text: "Cancel the current action / deselect" },
        ],
      },
      {
        title: "Operations",
        rows: [
          { keys: ["A"], text: "Continue a line from its end" },
          { keys: ["C"], text: "Merge nodes, lines or areas" },
          { keys: ["D"], text: "Disconnect" },
          { keys: ["E"], text: "Extract a point from a vertex" },
          { keys: ["Shift + E"], text: "Extract without copying relations" },
          { keys: ["X"], text: "Split a way at a vertex" },
          { keys: ["V"], text: "Reverse direction" },
          { keys: ["M"], text: "Move" },
          { keys: ["R"], text: "Rotate" },
          { keys: ["S"], text: "Straighten" },
          { keys: ["Q"], text: "Square the corners" },
          { keys: ["O"], text: "Make circular" },
          { keys: ["T", "Y"], text: "Flip along the long / short axis" },
          { keys: ["Shift + ← ↑ → ↓"], text: "Nudge the selection 10 px (Alt: 100 px)" },
          { keys: ["Shift + +", "Shift + −"], text: "Scale the selection (Alt: more)" },
          { keys: ["Shift + A", "8"], text: "Copy tags onto another feature" },
          { keys: ["Backspace"], text: "Downgrade to an address / building" },
          { keys: ["Delete", `${c} + ⌫`], text: "Delete" },
        ],
      },
    ],
    tools: [
      {
        title: "Panels",
        rows: [
          { keys: [`${c} + Shift + B`], text: "Background panel" },
          { keys: [`${c} + Shift + H`], text: "History panel (selected feature)" },
          { keys: [`${c} + Shift + M`], text: "Measurement panel" },
          { keys: [`${c} + Shift + L`], text: "Location panel (lat/lng, tile z/x/y, link)" },
        ],
      },
      {
        title: "The address bar",
        rows: [
          { keys: ["#map=zoom/lat/lng"], text: "The view is always in the URL — share or bookmark it" },
          { keys: ["&id=n12,w34"], text: "Selected features, so a link reopens them" },
        ],
      },
    ],
  };
}

const TABS: { id: Tab }[] = [{ id: "browsing" }, { id: "editing" }, { id: "tools" }];
const TAB_KEYS: Record<Tab, MessageKey> = { browsing: "tab.browsing", editing: "tab.editing", tools: "tab.tools" };

export default function ShortcutsPanel({ onClose, t }: { onClose: () => void; t: (key: MessageKey) => string }) {
  const cmd = useCmd();
  const [tab, setTab] = useState<Tab>("browsing");
  const sections = catalog(cmd)[tab];

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="flex max-h-[90vh] w-[40rem] max-w-full flex-col rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4 text-[12px] shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[color:var(--text-primary)]">{t("dialog.shortcuts")}</span>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-[color:var(--text-muted)] transition hover:bg-[color:var(--surface-3)]">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mb-3 flex gap-1">
          {TABS.map((t_) => (
            <button
              key={t_.id}
              type="button"
              onClick={() => setTab(t_.id)}
              className={cn(
                "flex-1 rounded-md px-2 py-1 text-[11px] font-medium transition",
                tab === t_.id ? "bg-[color:var(--orange-500)]/15 text-[color:var(--orange-400)]" : "text-[color:var(--text-muted)] hover:bg-[color:var(--surface-3)]",
              )}
            >
              {t(TAB_KEYS[t_.id])}
            </button>
          ))}
        </div>
        <div className="grid min-h-0 flex-1 gap-x-6 gap-y-4 overflow-y-auto pr-1 md:grid-cols-2">
          {sections.map((section) => (
            <div key={section.title} className="min-w-0">
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">{section.title}</div>
              <div className="flex flex-col gap-1.5">
                {section.rows.map((row) => (
                  <div key={row.text} className="flex items-start justify-between gap-3">
                    <span className="text-[color:var(--text-secondary)]">{row.text}</span>
                    <span className="flex shrink-0 flex-wrap justify-end gap-1">
                      {row.keys.map((k, i) => (
                        <span key={k} className="flex items-center gap-1">
                          {i > 0 ? <span className="text-[10px] text-[color:var(--text-muted)]">or</span> : null}
                          <kbd className="rounded border border-[color:var(--border)] bg-[color:var(--surface-1)] px-1.5 py-0.5 text-[10px] text-[color:var(--text-primary)]">{k}</kbd>
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
