"use client";

// The contextual edit menu — map-editor-full-spec.md §C7: "a short
// vertical list of icon buttons... anchored directly at the click/tap
// location... automatically flips to whichever horizontal side keeps it
// fully on-screen and shifts vertically to avoid viewport edges."
// Operations are filtered by what's conceptually valid for the current
// selection (§1.4) and each is independently enabled/disabled.

import { useEffect, useMemo, useState } from "react";
import { GitBranch, RotateCcw, Scissors, Trash2, Unlink } from "lucide-react";
import * as graphActions from "./lib/actions";
import type { EditorStore } from "./useEditorStore";

// §2D quick reference — clearance margins the menu keeps from the
// viewport edges when positioning/flipping itself.
const CLEARANCE = { top: 85, bottom: 45, side: 35 };
const MENU_WIDTH = 40;
const ITEM_HEIGHT = 36;

interface MenuOp {
  id: string;
  label: string;
  icon: typeof Trash2;
  enabled: boolean;
  danger?: boolean;
  run: () => void;
}

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

  const ops: MenuOp[] = useMemo(() => {
    if (!changeset) return [];
    const list: MenuOp[] = [];

    if (selection.length >= 1) {
      list.push({
        id: "delete",
        label: "Delete",
        icon: Trash2,
        danger: true,
        enabled: true,
        run: () => store.deleteSelection(),
      });
    }

    if (selection.length === 1 && selection[0].type === "node") {
      const node = graph.node(selection[0].id);
      const parentWays = node ? graph.parentWays(node.id) : [];

      list.push({
        id: "disconnect",
        label: "Disconnect",
        icon: Unlink,
        enabled: !!node && parentWays.length > 0,
        run: () => {
          if (!node) return;
          let g = graph;
          for (const way of parentWays) g = graphActions.disconnectNodeFromWay(g, way.id, node.id);
          store.commitGraph(g);
        },
      });

      const singleParent = parentWays.length === 1 ? parentWays[0] : null;
      const isInterior =
        !!node && !!singleParent && singleParent.nodeIds[0] !== node.id && singleParent.nodeIds[singleParent.nodeIds.length - 1] !== node.id;
      list.push({
        id: "split",
        label: "Split way here",
        icon: Scissors,
        enabled: isInterior,
        run: () => {
          if (!node || !singleParent) return;
          const newWayId = store.allocateId("way");
          store.commitGraph(graphActions.splitWayAtNode(graph, singleParent.id, node.id, newWayId));
        },
      });
    }

    if (selection.length === 1 && selection[0].type === "way") {
      const way = graph.way(selection[0].id);
      list.push({
        id: "reverse",
        label: "Reverse direction",
        icon: RotateCcw,
        enabled: !!way,
        run: () => {
          if (way) store.commitGraph(graphActions.reverseWay(graph, way.id));
        },
      });
    }

    if (selection.length === 2 && selection.every((s) => s.type === "node")) {
      const [a, b] = selection;
      const blocked = graph.parentRelations("node", a.id).length > 0 || graph.parentRelations("node", b.id).length > 0;
      list.push({
        id: "merge",
        label: "Merge nodes",
        icon: GitBranch,
        enabled: !blocked,
        run: () => {
          store.commitGraph(graphActions.mergeNodes(graph, a.id, b.id));
          store.select({ type: "node", id: a.id }, false);
        },
      });
    }

    return list;
  }, [selection, graph, changeset, store]);

  if (!menuAnchor || ops.length === 0) return null;

  const menuHeight = ops.length * ITEM_HEIGHT;
  const flipLeft = menuAnchor.x + CLEARANCE.side + MENU_WIDTH > viewport.width;
  const left = flipLeft ? menuAnchor.x - MENU_WIDTH - 8 : menuAnchor.x + 8;
  const top = Math.min(Math.max(menuAnchor.y - menuHeight / 2, CLEARANCE.top), Math.max(CLEARANCE.top, viewport.height - CLEARANCE.bottom - menuHeight));

  return (
    <div
      className="fixed z-[1100] flex flex-col overflow-hidden rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] shadow-xl"
      style={{ left, top, width: MENU_WIDTH }}
    >
      {ops.map((op) => {
        const Icon = op.icon;
        return (
          <button
            key={op.id}
            type="button"
            title={op.label}
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
