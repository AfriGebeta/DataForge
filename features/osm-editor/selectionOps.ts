"use client";

// The single catalog of operations that act on the current selection —
// shared by the contextual EditMenu (icons) and the keyboard shortcuts so
// they can never disagree about what's enabled. Shortcut letters follow
// iD's: M move, R rotate, T/Y reflect long/short, S straighten, Q square,
// O circularize, C merge, E extract, D disconnect, X split, V reverse,
// Ctrl+C/Ctrl+V copy/paste.

import { useEffect } from "react";
import {
  ArrowDownToLine,
  ArrowRightFromLine,
  ArrowUpFromLine,
  Circle,
  ClipboardPaste,
  Combine,
  Copy,
  FlipHorizontal2,
  FlipVertical2,
  GitBranch,
  Layers,
  Move,
  RotateCcw,
  RotateCw,
  Ruler,
  Scissors,
  SquareDashed,
  Tags,
  Trash2,
  Unlink,
  type LucideIcon,
} from "lucide-react";
import * as graphActions from "./lib/actions";
import {
  canMergePolygons,
  canOrthogonalize,
  circularizeWay,
  continuableWay,
  downgradeSelection,
  extractNode,
  joinWaysForced,
  nudgeNodes,
  scaleNodes,
  mergePolygons,
  nodeIdsOfSelection,
  orthogonalizeWay,
  reflectNodes,
  straightenWay,
} from "./lib/operations";
import { isClosedWay } from "./lib/geometryRoles";
import type { EditorStore } from "./useEditorStore";

function isAreaWay(graph: EditorStore["graph"], id: number): boolean {
  const w = graph.way(id);
  return !!w && isClosedWay(w);
}

export interface SelectionOp {
  id: string;
  label: string;
  hotkey?: string; // display only, e.g. "M"
  icon: LucideIcon;
  enabled: boolean;
  disabledReason?: string; // shown when the op is unavailable, so a no-op is never silent
  danger?: boolean;
  run: () => void;
}

export function buildOperations(store: EditorStore): SelectionOp[] {
  const { selection, graph, changeset } = store;
  if (!changeset) return [];
  const ops: SelectionOp[] = [];
  const single = selection.length === 1 ? selection[0] : null;
  const wayIds = selection.filter((s) => s.type === "way").map((s) => s.id);
  const movable = nodeIdsOfSelection(graph, selection);

  if (selection.length >= 1) {
    ops.push({ id: "delete", label: "Delete", hotkey: "⌘⌫ / Del", icon: Trash2, danger: true, enabled: true, run: () => store.deleteSelection() });
  }

  if (single?.type === "node") {
    const node = graph.node(single.id);
    const parentWays = node ? graph.parentWays(node.id) : [];
    ops.push({
      id: "disconnect",
      label: "Disconnect",
      hotkey: "D",
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
    ops.push({
      id: "split",
      label: "Split way here",
      hotkey: "X",
      icon: Scissors,
      enabled: isInterior,
      run: () => {
        if (!node || !singleParent) return;
        store.commitGraph(graphActions.splitWayAtNode(graph, singleParent.id, node.id, store.allocateId("way")));
      },
    });
    const extract = node ? extractNode(graph, node.id, () => store.allocateId("node")) : null;
    ops.push({
      id: "extract",
      label: "Extract this point from the line",
      hotkey: "E",
      icon: ArrowUpFromLine,
      enabled: extract !== null,
      run: () => {
        if (node) {
          const g = extractNode(graph, node.id, () => store.allocateId("node"));
          if (g) store.commitGraph(g);
        }
      },
    });
    // Only worth its own entry when the vertex is in a relation — otherwise
    // it would be identical to Extract.
    if (node && extract !== null && graph.parentRelations("node", node.id).length > 0) {
      ops.push({
        id: "extract-no-relations",
        label: "Extract without copying its relations",
        hotkey: "⇧E",
        icon: ArrowUpFromLine,
        enabled: true,
        run: () => {
          const g = extractNode(graph, node.id, () => store.allocateId("node"), { copyRelations: false });
          if (g) store.commitGraph(g);
        },
      });
    }
  }

  if (single?.type === "node") {
    const contWay = continuableWay(graph, single.id);
    ops.push({
      id: "continue",
      label: "Continue this line",
      hotkey: "A",
      icon: ArrowRightFromLine,
      enabled: contWay !== null,
      run: () => {
        if (contWay) store.startContinue(contWay.id, single.id);
      },
    });
  }

  if (single?.type === "way") {
    ops.push({
      id: "reverse",
      label: "Reverse direction",
      hotkey: "V",
      icon: RotateCcw,
      enabled: !!graph.way(single.id),
      run: () => store.commitGraph(graphActions.reverseWay(graph, single.id)),
    });
  }

  // Merge: two nodes → merge nodes; two or more lines → join into one.
  if (selection.length === 2 && selection.every((s) => s.type === "node")) {
    const [a, b] = selection;
    const blocked = graph.parentRelations("node", a.id).length > 0 || graph.parentRelations("node", b.id).length > 0;
    ops.push({
      id: "merge",
      label: "Merge nodes",
      hotkey: "C",
      icon: GitBranch,
      enabled: !blocked,
      run: () => {
        store.commitGraph(graphActions.mergeNodes(graph, a.id, b.id));
        store.select({ type: "node", id: a.id }, false);
      },
    });
  } else if (wayIds.length >= 2 && wayIds.length === selection.length && !wayIds.every((id) => isAreaWay(graph, id))) {
    ops.push({
      id: "join",
      label: "Merge these lines into one",
      hotkey: "C",
      icon: Combine,
      enabled: true,
      run: () => {
        const r = joinWaysForced(graph, wayIds);
        if ("reason" in r) return;
        const g = r.graph;
        store.commitGraph(g);
        const kept = g.visibleWays().find((w) => wayIds.includes(w.id));
        if (kept) store.select({ type: "way", id: kept.id }, false);
      },
    });
  }

  if (wayIds.length >= 2 && wayIds.length === selection.length && wayIds.every((id) => isAreaWay(graph, id))) {
    ops.push({
      id: "merge-areas",
      label: "Merge these areas into a multipolygon",
      hotkey: "C",
      icon: Layers,
      enabled: canMergePolygons(graph, wayIds),
      run: () => {
        const g = mergePolygons(graph, wayIds, () => store.allocateId("relation"));
        if (!g) return;
        store.commitGraph(g);
        const rel = g.visibleRelations().find((r) => r.id < 0 && r.members.some((m) => wayIds.includes(m.ref)) && !graph.relation(r.id));
        if (rel) store.select({ type: "relation", id: rel.id }, false);
      },
    });
  }

  if (movable.length > 0) {
    ops.push({ id: "move", label: "Move", hotkey: "M", icon: Move, enabled: true, run: () => store.startTransform("move") });
    ops.push({ id: "rotate", label: "Rotate", hotkey: "R", icon: RotateCw, enabled: movable.length >= 2, run: () => store.startTransform("rotate") });
    const reflectible = movable.length >= 2;
    ops.push({
      id: "reflect-long",
      label: "Flip long",
      hotkey: "T",
      icon: FlipHorizontal2,
      enabled: reflectible,
      run: () => {
        const g = reflectNodes(graph, movable, "long");
        if (g) store.commitGraph(g);
      },
    });
    ops.push({
      id: "reflect-short",
      label: "Flip short",
      hotkey: "Y",
      icon: FlipVertical2,
      enabled: reflectible,
      run: () => {
        const g = reflectNodes(graph, movable, "short");
        if (g) store.commitGraph(g);
      },
    });
  }

  if (wayIds.length >= 1 && wayIds.length === selection.length) {
    ops.push({
      id: "straighten",
      label: "Straighten",
      hotkey: "S",
      icon: Ruler,
      enabled: wayIds.length === 1 && straightenWay(graph, wayIds[0]) !== null,
      run: () => {
        const g = straightenWay(graph, wayIds[0]);
        if (g) store.commitGraph(g);
      },
    });
    ops.push({
      id: "orthogonalize",
      label: "Square the corners",
      hotkey: "Q",
      icon: SquareDashed,
      enabled: wayIds.some((id) => canOrthogonalize(graph, id)),
      run: () => {
        let g = graph;
        for (const id of wayIds) g = orthogonalizeWay(g, id) ?? g;
        store.commitGraph(g);
      },
    });
    const circ = wayIds.length === 1 ? circularizeWay(graph, wayIds[0], () => -1) : null;
    ops.push({
      id: "circularize",
      label: "Make circular",
      hotkey: "O",
      icon: Circle,
      enabled: circ !== null,
      run: () => {
        const g = circularizeWay(graph, wayIds[0], () => store.allocateId("node"));
        if (g) store.commitGraph(g);
      },
    });
  }

  if (selection.length >= 1 && downgradeSelection(graph, selection) !== null) {
    ops.push({
      id: "downgrade",
      label: "Downgrade (keep only the address / building)",
      hotkey: "⌫",
      icon: ArrowDownToLine,
      enabled: true,
      run: () => {
        const g = downgradeSelection(graph, selection);
        if (g) store.commitGraph(g);
      },
    });
  }

  if (selection.length >= 1) {
    const first = graph.get(selection[0].type, selection[0].id);
    ops.push({
      id: "copy-tags",
      label: selection.length === 1 ? "Copy tags onto another feature…" : "Copy tags from the first selected onto the others…",
      hotkey: "⇧A / 8",
      icon: Tags,
      enabled: !!first && Object.keys(first.tags).length > 0,
      run: () => {
        if (selection.length === 1) {
          store.setCopyTagsSource(selection[0]);
          store.flash("Click the feature to copy these tags onto (Esc to cancel)");
        } else {
          store.setCopyTagsDialogOpen(true);
        }
      },
    });
  }

  if (selection.length >= 1) {
    ops.push({ id: "copy", label: "Copy", hotkey: "Ctrl+C", icon: Copy, enabled: true, run: () => store.copySelection() });
  }
  if (store.hasClipboard()) {
    ops.push({ id: "paste", label: "Paste at cursor", hotkey: "Ctrl+V", icon: ClipboardPaste, enabled: !!store.cursorRef.current, run: () => store.pasteClipboard() });
  }

  return ops;
}

const KEY_TO_OP: Record<string, string> = {
  m: "move",
  r: "rotate",
  t: "reflect-long",
  y: "reflect-short",
  s: "straighten",
  q: "orthogonalize",
  o: "circularize",
  c: "merge",
  e: "extract",
  d: "disconnect",
  x: "split",
  v: "reverse",
  a: "continue",
};

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable;
}

const ARROWS: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
const PLUS_KEYS = new Set(["+", "="]);
const MINUS_KEYS = new Set(["-", "_"]);

// Installs the operation shortcuts, mapped like iD's:
//   letters (M R T Y S Q O C E D X V A)     the operation
//   Backspace                               Downgrade
//   Delete, ⌘⌫, ⌘⌦                          Delete
//   ⇧A, 8                                   Copy tags onto another feature
//   ⌘C / ⌘V                                 Copy / Paste
//   ⇧←↑→↓ (⌥ = x10)                         Nudge the selection 10 px (100 px)
//   ⇧+ / ⇧- (⌥ = x5)                        Scale the selection x1.05
// Called once from the page; reads the freshest store each render.
export function useOperationShortcuts(store: EditorStore) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isTyping(e.target) || store.transform || store.drawingBoundary) return;
      const key = e.key.toLowerCase();
      const mod = e.metaKey || e.ctrlKey;
      const ops = buildOperations(store);
      const run = (id: string): boolean => {
        const op = ops.find((o) => o.id === id);
        if (op && !op.enabled && op.disabledReason) {
          e.preventDefault();
          store.flash(op.disabledReason);
          return false;
        }
        if (!op?.enabled) return false;
        e.preventDefault();
        op.run();
        store.setMenuAnchor(null);
        return true;
      };

      if (mod && key === "c" && !e.shiftKey) {
        run("copy");
        return;
      }
      if (mod && key === "v") {
        run("paste");
        return;
      }
      if (store.mode !== "select" || store.selection.length === 0) return;

      // iD: Delete / ⌘⌫ / ⌘⌦ delete; plain Backspace downgrades.
      if (e.key === "Delete" || (mod && (e.key === "Backspace" || e.key === "Delete"))) {
        run("delete");
        return;
      }
      if (e.key === "Backspace" && !mod) {
        run("downgrade");
        return;
      }
      if (mod) return;

      // Shift combos: copy tags, nudge, scale.
      if (e.shiftKey) {
        if (key === "a") {
          run("copy-tags");
          return;
        }
        if (key === "e") {
          // ⇧E = extract without relations; falls back to plain extract
          // when the vertex has none (they're then identical).
          if (!run("extract-no-relations")) run("extract");
          return;
        }
        const arrow = ARROWS[e.key];
        if (arrow) {
          const ids = nodeIdsOfSelection(store.graph, store.selection);
          if (ids.length === 0) return;
          e.preventDefault();
          const px = e.altKey ? 100 : 10;
          store.commitGraph(nudgeNodes(store.graph, ids, arrow[0] * px, arrow[1] * px, store.zoom));
          return;
        }
        const factor = PLUS_KEYS.has(e.key) ? 1.05 : MINUS_KEYS.has(e.key) ? 1 / 1.05 : null;
        if (factor) {
          const ids = nodeIdsOfSelection(store.graph, store.selection);
          const g = scaleNodes(store.graph, ids, e.altKey ? Math.pow(factor, 5) : factor);
          if (g) {
            e.preventDefault();
            store.commitGraph(g);
          }
        }
        return;
      }
      if (e.altKey) return;

      if (e.key === "8") {
        run("copy-tags");
        return;
      }
      let opId = KEY_TO_OP[key];
      if (!opId) return;
      if (opId === "merge" && !ops.some((o) => o.id === "merge")) opId = ops.some((o) => o.id === "join") ? "join" : "merge-areas";
      run(opId);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
}
