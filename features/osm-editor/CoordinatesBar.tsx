"use client";

// A one-line status readout over the map's bottom edge: zoom, pointer
// lat/lng and the z/x/y tile under it. Toggle with ⌘I. Click to copy.

import { formatDecimal, formatTile, latLonToTile } from "./lib/location";
import { copyText, useLiveCursor } from "./panels/useLiveCursor";
import type { EditorStore } from "./useEditorStore";

export default function CoordinatesBar({ store }: { store: EditorStore }) {
  const live = useLiveCursor(store);
  if (live.zoom === null) return null;
  const at = live.cursor ?? live.center;
  if (!at) return null;
  const tile = latLonToTile(at.lat, at.lon, Math.max(0, Math.min(22, Math.floor(live.zoom))));
  const coords = formatDecimal(at.lat, at.lon, 5);
  return (
    <button
      type="button"
      onClick={() => void copyText(store, coords, "coordinates")}
      title="Click to copy the coordinates"
      className="absolute bottom-6 right-3 z-[1000] rounded-md border border-[color:var(--border)] bg-[color:var(--surface-2)]/90 px-2 py-1 font-mono text-[10px] text-[color:var(--text-secondary)] shadow backdrop-blur transition hover:text-[color:var(--text-primary)]"
    >
      z{live.zoom.toFixed(1)} · {coords} · tile {formatTile(tile)}
    </button>
  );
}
