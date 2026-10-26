"use client";

// Global keyboard shortcuts for navigation, panels and selection stepping,
// mapped like iD (data/shortcuts.json + the Gebeta fork's additions). The
// per-feature operation keys (M R S Q O C E D X V A, Backspace, Delete,
// ⇧A, nudge/scale) live with the operations in selectionOps.ts.
//
//   Browsing   ←↑→↓ pan (Alt = a screenful) · + − zoom (Alt = 4 levels)
//              B background · ⌘B previous background · U map data · I issues
//              ⇧⌘B/H/M/L background/history/measure/location panels
//              W wireframe · Alt+W data layer · G highlight edits · ` sidebar
//              / minimap · H or ? this reference · ⌘I coordinates bar · ⌃⌘F full screen
//   Search/Go  ⌘F search · ⌘G go to lat/lng, tile z/x/y or bounds
//   Drawing    1 point · 2 line · 3 area · N note · Space = click at the pointer
//   Selection  Z zoom to · [ ] prev/next vertex · { } first/last (Home/End)
//              ⌘↑ parent · ⌘↓ child · \ switch followed way · Space select hovered
//   File       ⌘S save · ⌘Z / ⇧⌘Z undo / redo

import { useEffect, useRef } from "react";
import { resolveImagery } from "./lib/imagery";
import { streetLevelUrl } from "./lib/location";
import { selectionBounds, vertexStep, type VertexStep } from "./lib/navigation";
import type { PanelId } from "./panels/ids";
import type { EditorStore, SelectionEntry } from "./useEditorStore";

export interface ShortcutUi {
  togglePanel: (id: PanelId) => void;
  openGoTo: () => void;
  openSearch: () => void;
  toggleShortcuts: () => void;
  openSave: () => void;
  toggleCoordsBar: () => void;
}

const PAN_PX = 80;

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable;
}

function imageryName(store: EditorStore, id: string): string {
  return resolveImagery(id, store.imagery.customUrl)?.name ?? "None";
}

export function useNavigationShortcuts(store: EditorStore, ui: ShortcutUi) {
  // Which parent way `[` / `]` follow when a vertex is shared (iD's "\").
  const followed = useRef(new Map<number, number>());
  // The vertex last visited on a way, so ⌘↓ returns to where ⌘↑ came from.
  const lastChild = useRef(new Map<number, number>());
  const previousImagery = useRef<string | null>(null);

  useEffect(() => {
    function select(entries: SelectionEntry[]) {
      if (entries.length === 0) return;
      store.select(entries[0], false);
      if (entries.length > 1) store.setSelection(entries);
    }

    // Keep a newly-selected vertex on screen.
    function reveal(nodeId: number) {
      const map = store.mapRef.current;
      const n = store.graph.node(nodeId);
      if (map && n) map.panInside([n.lat, n.lon], { padding: [80, 80], animate: true });
    }

    function parentWayFor(nodeId: number) {
      const parents = store.graph.parentWays(nodeId);
      if (parents.length === 0) return null;
      const wanted = followed.current.get(nodeId);
      return parents.find((w) => w.id === wanted) ?? parents[0];
    }

    function stepVertex(step: VertexStep): boolean {
      const sel = store.selection.length === 1 ? store.selection[0] : null;
      if (!sel || sel.type !== "node") return false;
      const way = parentWayFor(sel.id);
      if (!way) return false;
      const target = vertexStep(way, sel.id, step);
      if (target === null || target === sel.id) {
        store.flash(step === "prev" || step === "first" ? "This is the first vertex" : "This is the last vertex");
        return true;
      }
      lastChild.current.set(way.id, target);
      select([{ type: "node", id: target }]);
      reveal(target);
      return true;
    }

    function selectParent(): boolean {
      const g = store.graph;
      if (store.selection.length === 1 && store.selection[0].type === "node") {
        const id = store.selection[0].id;
        const ways = g.parentWays(id);
        if (ways.length === 0) {
          store.flash("This point isn't part of a line or area");
          return true;
        }
        ways.forEach((w) => lastChild.current.set(w.id, id));
        select(ways.map((w) => ({ type: "way" as const, id: w.id })));
        return true;
      }
      const rels = new Map<number, true>();
      for (const s of store.selection) {
        if (s.type === "relation") continue;
        for (const r of g.parentRelations(s.type, s.id)) rels.set(r.id, true);
      }
      if (rels.size === 0) {
        store.flash("Nothing contains this selection");
        return true;
      }
      select([...rels.keys()].map((id) => ({ type: "relation" as const, id })));
      return true;
    }

    function selectChild(): boolean {
      if (store.selection.length !== 1) return false;
      const sel = store.selection[0];
      if (sel.type === "way") {
        const way = store.graph.way(sel.id);
        if (!way) return true;
        const remembered = lastChild.current.get(way.id);
        const id = remembered !== undefined && way.nodeIds.includes(remembered) ? remembered : way.nodeIds[0];
        select([{ type: "node", id }]);
        reveal(id);
        return true;
      }
      if (sel.type === "relation") {
        const rel = store.graph.relation(sel.id);
        const members = (rel?.members ?? []).filter((m) => store.graph.has(m.type, m.ref)).map((m) => ({ type: m.type, id: m.ref }));
        if (members.length === 0) store.flash("None of this relation's members are loaded");
        else select(members);
        return true;
      }
      return false;
    }

    function cycleFollowedWay(): boolean {
      const sel = store.selection.length === 1 ? store.selection[0] : null;
      if (!sel || sel.type !== "node") return false;
      const parents = store.graph.parentWays(sel.id);
      if (parents.length < 2) {
        store.flash("This vertex only belongs to one way");
        return true;
      }
      const current = parentWayFor(sel.id)!;
      const next = parents[(parents.findIndex((w) => w.id === current.id) + 1) % parents.length];
      followed.current.set(sel.id, next.id);
      store.flash(`[ and ] now follow way #${next.id}`);
      return true;
    }

    function zoomToSelection(): boolean {
      if (store.selection.length === 0) return false;
      const b = selectionBounds(store.graph, store.selection);
      if (!b) return true;
      if (b.minLat === b.maxLat && b.minLon === b.maxLon) store.focusOn(b.minLat, b.minLon, 19);
      else store.fitBounds(b);
      return true;
    }

    function quickSwitchBackground() {
      const current = store.imagery.id;
      const target = previousImagery.current && previousImagery.current !== current ? previousImagery.current : current === "osm" ? "hot" : "osm";
      previousImagery.current = current;
      store.setImagery({ id: target });
      store.flash(`Background: ${imageryName(store, target)}`);
    }

    function toggleFullscreen() {
      try {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen();
      } catch {
        store.flash("Full screen isn't available here");
      }
    }

    function drawTool(mode: "drawPoint" | "drawLine" | "drawArea") {
      if (!store.changeset) {
        store.flash(store.t("flash.startSession"));
        return;
      }
      store.setMode(store.mode === mode ? "browse" : mode);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (isTyping(e.target) || e.defaultPrevented) return;
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      const handled = () => e.preventDefault();
      const inDraw = store.mode.startsWith("draw");
      const hasSelection = store.mode === "select" && store.selection.length > 0;

      // ── with ⌘/Ctrl ───────────────────────────────────────────────
      if (e.ctrlKey && e.metaKey && key === "f") return handled(), toggleFullscreen();
      if (mod && e.shiftKey && !e.altKey) {
        const panels: Record<string, PanelId> = { b: "background", h: "history", m: "measure", l: "location" };
        if (panels[key]) return handled(), ui.togglePanel(panels[key]);
      }
      if (mod && !e.shiftKey && !e.altKey) {
        switch (key) {
          case "g":
            return handled(), ui.openGoTo();
          case "f":
            return handled(), ui.openSearch();
          case "s":
            return handled(), ui.openSave();
          case "i":
            return handled(), ui.toggleCoordsBar();
          case "b":
            return handled(), quickSwitchBackground();
        }
        if (hasSelection && e.key === "ArrowUp" && selectParent()) return handled();
        if (hasSelection && e.key === "ArrowDown" && selectChild()) return handled();
        if (hasSelection && e.key === "[" && stepVertex("first")) return handled();
        if (hasSelection && e.key === "]" && stepVertex("last")) return handled();
        return; // other ⌘ combos belong to the browser / operations
      }

      // ── Alt combos (use e.code: Alt changes e.key on macOS) ───────
      if (e.altKey && !mod && e.code === "KeyW") {
        if (inDraw) return;
        handled();
        store.setDataVisible(!store.dataVisible);
        store.flash(store.dataVisible ? store.t("flash.dataHidden") : store.t("flash.dataShown"));
        return;
      }

      // ── pan / zoom ────────────────────────────────────────────────
      const map = store.mapRef.current;
      const arrows: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (arrows[e.key] && !e.shiftKey) {
        if (!map) return;
        handled();
        const [dx, dy] = arrows[e.key];
        const size = map.getSize();
        // Instant, not animated: Leaflet restarts an in-flight pan animation
        // from where it currently is and an instant pan issued during one
        // is overwritten when it ends, so animated pans swallowed most of
        // a burst of key presses. Key-repeat gives fluid scrolling anyway.
        // Alt pans a full screenful, like iD.
        map.panBy([dx * (e.altKey ? size.x : PAN_PX), dy * (e.altKey ? size.y : PAN_PX)], { animate: false });
        return;
      }
      const isPlus = e.key === "+" || e.key === "=";
      const isMinus = e.key === "-" || e.key === "_";
      if ((isPlus || isMinus) && map) {
        // Shift+/− scale the selection (selectionOps) instead of zooming.
        if (e.shiftKey && hasSelection) return;
        handled();
        const levels = e.altKey ? 4 : 1;
        map.setZoom(map.getZoom() + (isPlus ? levels : -levels), { animate: true });
        return;
      }
      if (e.altKey) return;

      // ── Space: select what's under the pointer (draw modes own Space) ─
      if (e.key === " ") {
        if (inDraw || store.transform) return;
        const hovered = store.hoverRef.current;
      const m = hovered ? /^([nwr])(-?\d+)$/.exec(hovered) : null;
        if (!m) return;
        handled();
        store.select({ type: m[1] === "n" ? "node" : m[1] === "w" ? "way" : "relation", id: Number(m[2]) }, e.shiftKey);
        return;
      }

      // ⇧P: street-level photos (opens Mapillary at the pointer, else the center).
      if (e.shiftKey && key === "p") {
        handled();
        const at = store.cursorRef.current ?? (map ? { lat: map.getCenter().lat, lon: map.getCenter().lng } : null);
        if (at) window.open(streetLevelUrl(at.lat, at.lon, map?.getZoom() ?? 17), "_blank", "noopener,noreferrer");
        return;
      }

      // ── tools & panels ────────────────────────────────────────────
      if (e.shiftKey && e.key !== "?" && e.key !== "{" && e.key !== "}") return;
      switch (e.key) {
        case "1":
          return handled(), drawTool("drawPoint");
        case "n":
        case "N":
          // Notes aren't edits, so no editing session is needed.
          handled();
          store.setMode(store.mode === "addNote" ? "browse" : "addNote");
          return;
        case "2":
          return handled(), drawTool("drawLine");
        case "3":
          return handled(), drawTool("drawArea");
        case "?":
          return handled(), ui.toggleShortcuts();
        case "/":
          return handled(), store.setShowMinimap(!store.showMinimap);
        case "`":
          handled();
          store.setSidebarVisible(!store.sidebarVisible);
          store.flash(store.sidebarVisible ? store.t("flash.sidebarHidden") : store.t("flash.sidebarShown"));
          return;
      }
      if (inDraw) return;
      switch (key) {
        case "b":
          return handled(), ui.togglePanel("background");
        case "u":
          return handled(), ui.togglePanel("data");
        case "p":
          return handled(), ui.togglePanel("preferences");
        case "i":
          return handled(), ui.togglePanel("issues");
        case "h":
          return handled(), ui.toggleShortcuts();
        case "w":
          handled();
          store.setWireframe(!store.wireframe);
          store.flash(store.wireframe ? store.t("flash.wireframeOff") : store.t("flash.wireframeOn"));
          return;
        case "g":
          handled();
          store.setHighlightEdits(!store.highlightEdits);
          store.flash(store.highlightEdits ? store.t("flash.highlightOff") : store.t("flash.highlightOn"));
          return;
      }

      // ── selection stepping (select mode) ──────────────────────────
      if (!hasSelection) return;
      if (key === "z") return zoomToSelection() ? handled() : undefined;
      if (e.key === "[" || e.key === "PageUp") return stepVertex("prev") ? handled() : undefined;
      if (e.key === "]" || e.key === "PageDown") return stepVertex("next") ? handled() : undefined;
      if (e.key === "{" || e.key === "Home") return stepVertex("first") ? handled() : undefined;
      if (e.key === "}" || e.key === "End") return stepVertex("last") ? handled() : undefined;
      if (e.key === "\\" || e.key === "Pause") return cycleFollowedWay() ? handled() : undefined;
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
}
