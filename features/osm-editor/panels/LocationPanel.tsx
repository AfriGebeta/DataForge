"use client";

// Location panel (⌘⇧L) — iD's Location info panel plus the tile view the
// Gebeta fork cares about: where the pointer is in decimal and DMS, which
// slippy-map tile (z/x/y) that is, and a shareable link to this view.

import { formatDecimal, formatDms, formatTile, latLonToTile, streetLevelUrl, tileBounds } from "../lib/location";
import type { EditorStore } from "../useEditorStore";
import PanelShell from "./PanelShell";
import { copyText, useLiveCursor } from "./useLiveCursor";

const btn =
  "rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-2 py-1 text-[11px] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-3)] disabled:opacity-40";

function Row({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="shrink-0 text-[color:var(--text-muted)]">{label}</span>
      <button type="button" onClick={onCopy} disabled={!onCopy} title={onCopy ? "Click to copy" : undefined} className="text-right font-mono text-[11px] text-[color:var(--text-primary)] enabled:hover:underline">
        {value}
      </button>
    </div>
  );
}

export default function LocationPanel({ store, onClose, onGoTo }: { store: EditorStore; onClose: () => void; onGoTo: () => void }) {
  const live = useLiveCursor(store);
  const at = live.cursor ?? live.center;
  const zoom = live.zoom ?? 0;
  const tile = at ? latLonToTile(at.lat, at.lon, Math.max(0, Math.min(22, Math.floor(zoom)))) : null;

  return (
    <PanelShell title={store.t("panel.location")} onClose={onClose}>
      {!at ? (
        <div className="text-[color:var(--text-muted)]">Move the pointer over the map.</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <Row label={live.cursor ? "Pointer" : "Center"} value={formatDecimal(at.lat, at.lon)} onCopy={() => void copyText(store, formatDecimal(at.lat, at.lon), "coordinates")} />
          <Row label="" value={`${formatDms(at.lat, "lat")}  ${formatDms(at.lon, "lon")}`} />
          <Row label="Zoom" value={zoom.toFixed(2)} />
          {tile ? <Row label="Tile z/x/y" value={formatTile(tile)} onCopy={() => void copyText(store, formatTile(tile), "tile")} /> : null}
          {live.center ? <Row label="Map center" value={formatDecimal(live.center.lat, live.center.lon, 5)} /> : null}
        </div>
      )}
      <div className="mt-1 flex flex-wrap gap-1.5">
        <button type="button" className={btn} onClick={() => void copyText(store, window.location.href, "link to this view")}>
          Copy link to this view
        </button>
        <button
          type="button"
          className={btn}
          disabled={!tile}
          onClick={() => {
            if (!tile) return;
            const b = tileBounds(tile);
            store.setBoundary({ bounds: b, kind: "tile", label: `Tile ${formatTile(tile)}` });
            store.flash(`Boundary set to tile ${formatTile(tile)}`);
          }}
        >
          Outline this tile
        </button>
        <button type="button" className={btn} onClick={onGoTo}>
          Go to…
        </button>
        <button
          type="button"
          className={btn}
          disabled={!at}
          title="Opens Mapillary at this spot in a new tab (⇧P)"
          onClick={() => at && window.open(streetLevelUrl(at.lat, at.lon, zoom), "_blank", "noopener,noreferrer")}
        >
          Street-level photos ↗
        </button>
      </div>
      <div className="text-[10px] text-[color:var(--text-muted)]">The address bar always holds the current view as #map=zoom/lat/lon — copy it from there too.</div>
    </PanelShell>
  );
}
