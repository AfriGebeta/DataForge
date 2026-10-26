"use client";

import { useEffect, useState } from "react";
import type { LatLon } from "../lib/location";
import type { EditorStore } from "../useEditorStore";

export interface LiveView {
  cursor: LatLon | null; // last pointer position over the map
  center: LatLon | null;
  zoom: number | null;
}

const EMPTY: LiveView = { cursor: null, center: null, zoom: null };

const same = (a: LatLon | null, b: LatLon | null) => (a === null || b === null ? a === b : a.lat === b.lat && a.lon === b.lon);

// The pointer position lives in a ref (updating state per mousemove would
// re-render the whole editor), so readouts poll it a few times a second.
export function useLiveCursor(store: EditorStore): LiveView {
  const { cursorRef, mapRef } = store;
  const [view, setView] = useState<LiveView>(EMPTY);
  useEffect(() => {
    const id = window.setInterval(() => {
      const map = mapRef.current;
      const c = map?.getCenter();
      const next: LiveView = {
        cursor: cursorRef.current,
        center: c ? { lat: c.lat, lon: c.lng } : null,
        zoom: map ? map.getZoom() : null,
      };
      setView((prev) => (same(prev.cursor, next.cursor) && same(prev.center, next.center) && prev.zoom === next.zoom ? prev : next));
    }, 200);
    return () => window.clearInterval(id);
  }, [cursorRef, mapRef]);
  return view;
}

export async function copyText(store: EditorStore, text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    store.flash(`Copied ${what}`);
  } catch {
    store.flash("Couldn't copy — your browser blocked clipboard access");
  }
}
