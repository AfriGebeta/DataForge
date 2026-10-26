"use client";

// Map-attached navigation behavior, all inside the MapContainer:
//   MapUrlSync            keeps `#map=zoom/lat/lon&id=…` in the address bar
//                         (iD's behaviorHash) and restores it on load
//   BoundaryOverlay       the highlighted tile / bbox from Go-to
//   BoundaryDrawController drag a rectangle on the map to set a boundary
//   ContextMenuHandler    right-click opens the edit menu (selecting what's
//                         under the pointer first, like iD)

import { useCallback, useEffect, useState } from "react";
import { Polyline, Rectangle, Tooltip, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { getNote } from "./api";
import { findSnap } from "./lib/snapping";
import { SpatialIndex } from "./lib/spatialIndex";
import { loadAround, loadBounds } from "./navigate";
import { parseHash, parseLegacyQuery, updateHash, type Bounds } from "./lib/location";
import type { EditorStore } from "./useEditorStore";

const LAST_LOCATION_KEY = "osm-editor:last-location";

function readLastLocation(): { lat: number; lon: number; zoom: number } | null {
  try {
    const raw = window.localStorage.getItem(LAST_LOCATION_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { lat: number; lon: number; zoom: number };
    return [v.lat, v.lon, v.zoom].every(Number.isFinite) ? v : null;
  } catch {
    return null;
  }
}

function MapUrlSync({ store }: { store: EditorStore }) {
  const map = useMap();
  const { selection, pendingSelectRef, selectedNoteId } = store;
  const idsKey = [
    ...selection.filter((s) => s.id > 0).map((s) => `${s.type[0]}${s.id}`),
    ...(selectedNoteId !== null ? [`note/${selectedNoteId}`] : []),
  ].join(",");

  // 1) Restore once: hash > legacy ?lat&lon&zoom > last visited location.
  useEffect(() => {
    const hash = parseHash(window.location.hash);
    const legacy = parseLegacyQuery(window.location.search);
    const view = hash.lat !== undefined ? hash : legacy.lat !== undefined ? legacy : readLastLocation();
    if (view && view.lat !== undefined && view.lon !== undefined) {
      map.setView([view.lat, view.lon], view.zoom ?? 17, { animate: false });
    }
    // A link to specific features: load their area and select them.
    if (hash.ids && hash.ids.length > 0) {
      const letter: Record<string, "node" | "way" | "relation"> = { n: "node", w: "way", r: "relation" };
      const elementIds = hash.ids.filter((s) => !s.startsWith("note/"));
      if (elementIds.length > 0) {
        pendingSelectRef.current = elementIds.map((s) => ({ type: letter[s[0]], id: Number(s.slice(1)) }));
        const c = map.getCenter();
        loadAround(store, c.lat, c.lng, map.getZoom());
      }
      // A note link: fetch the note itself, show it and select it.
      const noteId = hash.ids.find((s) => s.startsWith("note/"));
      if (noteId) {
        getNote(Number(noteId.slice(5)))
          .then((note) => {
            store.upsertNote(note);
            store.selectNote(note.id);
            if (hash.lat === undefined) store.focusOn(note.lat, note.lon, 18);
          })
          .catch(() => store.flash("That note doesn't exist any more"));
      }
    }
    // The old query-string form is rewritten to the hash form.
    if (legacy.lat !== undefined && hash.lat === undefined) {
      window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    }
    // once, on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // 2) Write the view + selection into the hash; remember the location.
  const write = useCallback(() => {
    const c = map.getCenter();
    const next = updateHash(window.location.hash, { zoom: map.getZoom(), lat: c.lat, lon: c.lng }, idsKey ? idsKey.split(",") : []);
    if (next !== window.location.hash) window.history.replaceState(null, "", window.location.pathname + window.location.search + next);
    try {
      window.localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify({ lat: c.lat, lon: c.lng, zoom: map.getZoom() }));
    } catch {
      // private mode / quota: remembering the last view isn't worth an error
    }
  }, [map, idsKey]);
  useMapEvents({ moveend: write });
  useEffect(() => write(), [write]);

  // 3) Back/forward or a hand-edited address bar moves the map.
  useEffect(() => {
    function onHashChange() {
      const h = parseHash(window.location.hash);
      if (h.lat === undefined || h.lon === undefined || h.zoom === undefined) return;
      const c = map.getCenter();
      if (Math.abs(c.lat - h.lat) > 1e-6 || Math.abs(c.lng - h.lon) > 1e-6 || Math.abs(map.getZoom() - h.zoom) > 0.01) {
        map.setView([h.lat, h.lon], h.zoom, { animate: true });
      }
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [map]);

  return null;
}

const toLeaflet = (b: Bounds): L.LatLngBoundsExpression => [
  [b.minLat, b.minLon],
  [b.maxLat, b.maxLon],
];

function BoundaryOverlay({ store }: { store: EditorStore }) {
  const b = store.boundary;
  if (!b) return null;
  const tile = b.kind === "tile";
  return (
    <Rectangle
      bounds={toLeaflet(b.bounds)}
      pathOptions={{ color: tile ? "#d97706" : "#475569", weight: 2, dashArray: tile ? undefined : "8 5", fillColor: tile ? "#d97706" : "#475569", fillOpacity: 0.06 }}
      interactive={false}
    >
      <Tooltip permanent direction="top" offset={[0, -2]} className="osm-editor-label">
        {b.label}
      </Tooltip>
    </Rectangle>
  );
}

function BoundaryDrawController({ store }: { store: EditorStore }) {
  const map = useMap();
  const active = store.drawingBoundary;
  const [drag, setDrag] = useState<{ a: L.LatLng; b: L.LatLng } | null>(null);

  useEffect(() => {
    if (!active) return;
    const el = map.getContainer();
    el.classList.add("osm-editor-boundary-draw");
    map.dragging.disable();
    return () => {
      el.classList.remove("osm-editor-boundary-draw");
      map.dragging.enable();
    };
  }, [active, map]);

  useMapEvents({
    mousedown(e) {
      if (active) setDrag({ a: e.latlng, b: e.latlng });
    },
    mousemove(e) {
      if (active && drag) setDrag({ a: drag.a, b: e.latlng });
    },
    mouseup(e) {
      if (!active || !drag) return;
      const a = drag.a;
      const bPt = e.latlng;
      setDrag(null);
      const bounds: Bounds = {
        minLat: Math.min(a.lat, bPt.lat),
        maxLat: Math.max(a.lat, bPt.lat),
        minLon: Math.min(a.lng, bPt.lng),
        maxLon: Math.max(a.lng, bPt.lng),
      };
      store.setDrawingBoundary(false);
      // A click without a drag isn't a box.
      if (bounds.maxLat - bounds.minLat < 1e-7 || bounds.maxLon - bounds.minLon < 1e-7) {
        store.flash("Boundary cancelled — drag to draw a box");
        return;
      }
      store.setBoundary({ bounds, kind: "bounds", label: "Boundary" });
      store.fitBounds(bounds);
      if (loadBounds(store, bounds)) store.flash("Boundary set — loading its data");
      else store.flash("Boundary set");
    },
  });

  if (!drag) return null;
  return (
    <Rectangle
      bounds={[
        [drag.a.lat, drag.a.lng],
        [drag.b.lat, drag.b.lng],
      ]}
      pathOptions={{ color: "#38bdf8", weight: 2, dashArray: "6 4", fillOpacity: 0.08 }}
      interactive={false}
    />
  );
}

// Auto-trace's "draw the area" step: same drag-a-box gesture as the boundary
// tool, but the result goes to the trace panel instead of becoming a boundary.
function TraceBoxController({ store }: { store: EditorStore }) {
  const map = useMap();
  const active = store.tracePicking;
  const [drag, setDrag] = useState<{ a: L.LatLng; b: L.LatLng } | null>(null);

  useEffect(() => {
    if (!active) return;
    const el = map.getContainer();
    el.classList.add("osm-editor-boundary-draw");
    map.dragging.disable();
    return () => {
      el.classList.remove("osm-editor-boundary-draw");
      map.dragging.enable();
    };
  }, [active, map]);

  useMapEvents({
    mousedown(e) {
      if (active) setDrag({ a: e.latlng, b: e.latlng });
    },
    mousemove(e) {
      if (active && drag) setDrag({ a: drag.a, b: e.latlng });
    },
    mouseup(e) {
      if (!active || !drag) return;
      const a = drag.a;
      setDrag(null);
      store.setTracePicking(false);
      const bounds: Bounds = {
        minLat: Math.min(a.lat, e.latlng.lat),
        maxLat: Math.max(a.lat, e.latlng.lat),
        minLon: Math.min(a.lng, e.latlng.lng),
        maxLon: Math.max(a.lng, e.latlng.lng),
      };
      if (bounds.maxLat - bounds.minLat < 1e-6 || bounds.maxLon - bounds.minLon < 1e-6) {
        store.flash("Drag a box over the roads you want to trace");
        return;
      }
      store.setTraceBox(bounds);
      store.setTracePreview(null);
    },
  });

  if (!drag) return null;
  return (
    <Rectangle
      bounds={[
        [drag.a.lat, drag.a.lng],
        [drag.b.lat, drag.b.lng],
      ]}
      pathOptions={{ color: "#a855f7", weight: 2, dashArray: "6 4", fillOpacity: 0.08 }}
      interactive={false}
    />
  );
}

// The chosen trace box and the not-yet-accepted traced lines.
function TraceOverlay({ store }: { store: EditorStore }) {
  return (
    <>
      {store.traceBox ? <Rectangle bounds={toLeaflet(store.traceBox)} pathOptions={{ color: "#a855f7", weight: 2, dashArray: "8 5", fillOpacity: 0.04 }} interactive={false} /> : null}
      {store.tracePreview?.map((line, i) => (
        <Polyline key={i} positions={line.map((p) => [p.lat, p.lon] as [number, number])} pathOptions={{ color: "#a855f7", weight: 4, opacity: 0.9 }} interactive={false} />
      ))}
    </>
  );
}

function ContextMenuHandler({ store }: { store: EditorStore }) {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    function onContextMenu(e: MouseEvent) {
      e.preventDefault(); // never show the browser's menu over the editor
      if (store.transform || store.drawingBoundary || store.mode.startsWith("draw")) return;
      const anchor = { x: e.clientX, y: e.clientY };
      let hovered = store.hoverRef.current;
      if (!hovered) {
        // Hover state can be empty (cursor over a marker, or the hover event
        // never fired for a canvas path) — hit-test at the cursor instead.
        const latlng = map.mouseEventToLatLng(e);
        const snap = findSnap(L, map, new SpatialIndex(store.graph), latlng.lat, latlng.lng);
        if (snap?.kind === "node") hovered = `n${snap.node.id}`;
        else if (snap?.kind === "way") hovered = `w${snap.way.id}`;
      }
      const m = hovered ? /^([nwr])(-?\d+)$/.exec(hovered) : null;
      if (m) {
        const type = m[1] === "n" ? "node" : m[1] === "w" ? "way" : "relation";
        const entry = { type: type as "node" | "way" | "relation", id: Number(m[2]) };
        const already = store.selection.some((s) => s.type === entry.type && s.id === entry.id);
        if (already) store.setMenuAnchor(anchor);
        else store.select(entry, false, anchor);
      } else if (store.selection.length > 0) {
        store.setMenuAnchor(anchor);
      }
    }
    el.addEventListener("contextmenu", onContextMenu);
    return () => el.removeEventListener("contextmenu", onContextMenu);
  }, [map, store]);
  return null;
}

export default function MapNavigation({ store }: { store: EditorStore }) {
  return (
    <>
      <MapUrlSync store={store} />
      <BoundaryOverlay store={store} />
      <BoundaryDrawController store={store} />
      <TraceBoxController store={store} />
      <TraceOverlay store={store} />
      <ContextMenuHandler store={store} />
    </>
  );
}
