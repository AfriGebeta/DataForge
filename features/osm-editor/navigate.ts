// Shared "go to" behavior for the Go-to dialog, the search box and URL
// links, so every way of naming a place does the same thing: fly there,
// optionally set a boundary, optionally load the data.

import { fetchElementLocation } from "./api";
import { selectionBounds } from "./lib/navigation";
import { boundsCenter, formatTile, latLonToTile, tileBounds, type Bounds, type ParsedLocation } from "./lib/location";
import type { EditorStore } from "./useEditorStore";

// The backend refuses map reads bigger than this (PlaceForge
// MaxBboxAreaSqDegrees); checking here gives a clear message instead of a 400.
export const MAX_LOAD_AREA_SQ_DEG = 0.25;

export function boundsArea(b: Bounds): number {
  return (b.maxLat - b.minLat) * (b.maxLon - b.minLon);
}

// Asks the page to load `b`. Returns false (with a toast) if it's too big
// or if loading would throw away unsaved work: a load REPLACES the whole
// working graph, and navigation shortcuts (Go to, search, links) must never
// do that silently. (The explicit "Load / refresh view" button keeps its
// replace-everything behavior — it's the documented way to discard edits
// after a save conflict.)
export function loadBounds(store: EditorStore, b: Bounds): boolean {
  if (store.hasUnsavedChanges) {
    store.flash("You have unsaved edits — save or undo them before loading another area.");
    return false;
  }
  if (boundsArea(b) > MAX_LOAD_AREA_SQ_DEG) {
    store.flash("That area is too large to load — pick a smaller tile or box (max 0.25 sq°).");
    return false;
  }
  store.requestLoad(b);
  return true;
}

// The tile around a point, used to load "the area near here". Never
// coarser than z16 so the area stays small.
export function loadAround(store: EditorStore, lat: number, lon: number, zoom: number): boolean {
  return loadBounds(store, tileBounds(latLonToTile(lat, lon, Math.max(16, Math.min(18, Math.round(zoom))))));
}

export async function goTo(store: EditorStore, target: ParsedLocation, opts: { load: boolean }): Promise<void> {
  switch (target.kind) {
    case "latlon": {
      const zoom = target.zoom ?? 18;
      store.focusOn(target.lat, target.lon, zoom);
      if (opts.load) loadAround(store, target.lat, target.lon, zoom);
      return;
    }
    case "tile": {
      const b = tileBounds(target.tile);
      store.setBoundary({ bounds: b, kind: "tile", label: `Tile ${formatTile(target.tile)}` });
      store.fitBounds(b);
      if (opts.load) loadBounds(store, b);
      return;
    }
    case "bounds": {
      store.setBoundary({ bounds: target.bounds, kind: "bounds", label: "Boundary" });
      store.fitBounds(target.bounds);
      if (opts.load) loadBounds(store, target.bounds);
      return;
    }
    case "element": {
      const entry = { type: target.type, id: target.id };
      if (store.graph.get(entry.type, entry.id)) {
        store.select(entry, false);
        const b = selectionBounds(store.graph, [entry]);
        if (b) {
          if (b.minLat === b.maxLat && b.minLon === b.maxLon) store.focusOn(b.minLat, b.minLon, 19);
          else store.fitBounds(b);
        }
        return;
      }
      try {
        const at = await fetchElementLocation(entry.type, entry.id);
        store.focusOn(at.lat, at.lon, 18);
        // Only remember the pending selection if a load was really
        // requested; otherwise it would hijack some later, unrelated load.
        if (loadAround(store, at.lat, at.lon, 18)) store.pendingSelectRef.current = [entry];
      } catch (e) {
        store.flash(e instanceof Error ? e.message : `Couldn't find ${entry.type} #${entry.id}`);
      }
      return;
    }
  }
}

export { boundsCenter };
