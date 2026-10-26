"use client";

// The contextual edit menu — map-editor-full-spec.md §C7: "a short
// vertical list of icon buttons... anchored directly at the click/tap
// location... automatically flips to whichever horizontal side keeps it
// fully on-screen and shifts vertically to avoid viewport edges."
// Operations are filtered by what's conceptually valid for the current
// selection (§1.4) and each is independently enabled/disabled.

import { useEffect, useMemo, useState } from "react";
import { buildOperations, type SelectionOp } from "./selectionOps";
import type { EditorStore } from "./useEditorStore";

// §2D quick reference — clearance margins the menu keeps from the
// viewport edges when positioning/flipping itself.
const CLEARANCE = { top: 85, bottom: 45, side: 35 };
const MENU_WIDTH = 40;
const ITEM_HEIGHT = 36;

export default function EditMenu({ store }: { store: EditorStore }) {
  const { selection, graph, menuAnchor, changeset } = store;
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function update() {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Auto-dismiss on pan/zoom (§C7: "closes itself if map panning/zooming
  // would move it off its anchor point").
  useEffect(() => {
    if (!menuAnchor) return;
    const map = document.querySelector(".leaflet-container");
    if (!map) return;
    function dismiss() {
      store.setMenuAnchor(null);
    }
    map.addEventListener("wheel", dismiss, { passive: true });
    return () => map.removeEventListener("wheel", dismiss);
  }, [menuAnchor, store]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ops: SelectionOp[] = useMemo(() => buildOperations(store), [selection, graph, changeset, store.transform]);

  if (!menuAnchor || ops.length === 0) return null;

  const menuHeight = Math.min(ops.length * ITEM_HEIGHT, Math.max(ITEM_HEIGHT, viewport.height - CLEARANCE.top - CLEARANCE.bottom));
  const flipLeft = menuAnchor.x + CLEARANCE.side + MENU_WIDTH > viewport.width;
  const left = flipLeft ? menuAnchor.x - MENU_WIDTH - 8 : menuAnchor.x + 8;
  const top = Math.min(Math.max(menuAnchor.y - menuHeight / 2, CLEARANCE.top), Math.max(CLEARANCE.top, viewport.height - CLEARANCE.bottom - menuHeight));

  return (
    <div
      className="fixed z-[1100] flex flex-col overflow-y-auto rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] shadow-xl"
      style={{ left, top, width: MENU_WIDTH, maxHeight: menuHeight }}
    >
      {ops.map((op) => {
        const Icon = op.icon;
        return (
          <button
            key={op.id}
            type="button"
            title={!op.enabled && op.disabledReason ? op.disabledReason : op.hotkey ? `${op.label} (${op.hotkey})` : op.label}
            disabled={!op.enabled}
            onClick={() => {
              op.run();
              store.setMenuAnchor(null);
            }}
            className={`flex h-9 w-full items-center justify-center border-b border-[color:var(--border)] last:border-b-0 transition hover:bg-[color:var(--surface-3)] disabled:cursor-not-allowed disabled:opacity-30 ${
              op.danger ? "text-[color:var(--text-danger)]" : "text-[color:var(--text-primary)]"
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
