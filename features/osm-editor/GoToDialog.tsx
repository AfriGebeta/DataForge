"use client";

// Go to… (Ctrl/Cmd+G) — the Gebeta iD fork's "Jump to Coordinate" and
// "Set boundary" tools in one dialog:
//   Lat / Lng   latitude, longitude (+ zoom) — any common format, pasted
//   Tile        slippy-map z / x / y, drawn as a boundary rectangle
//   Bounds      min/max lon/lat, or drag a box on the map
// "Load the map data" additionally fetches that area for editing.

import { useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { boundsArea, goTo, MAX_LOAD_AREA_SQ_DEG } from "./navigate";
import {
  formatTile,
  latLonToTile,
  parseLocationInput,
  tileBounds,
  validLatLon,
  validTile,
  type Bounds,
  type ParsedLocation,
} from "./lib/location";
import type { EditorStore } from "./useEditorStore";

type Tab = "latlng" | "tile" | "bounds";

const inputClass =
  "w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-2.5 py-1.5 text-[12px] text-[color:var(--text-primary)] outline-none focus:border-[color:var(--orange-400)]/50";
const buttonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1.5 text-[12px] font-medium text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-3)] disabled:opacity-40";
const primaryClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-[color:var(--orange-400)]/30 bg-[color:var(--orange-500)]/12 px-3 py-1.5 text-[12px] font-medium text-[color:var(--orange-400)] transition hover:bg-[color:var(--orange-500)]/20 disabled:opacity-40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-0.5 block text-[10px] text-[color:var(--text-muted)]">{label}</label>
      {children}
    </div>
  );
}

export default function GoToDialog({ store, onClose }: { store: EditorStore; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("latlng");
  const [load, setLoad] = useState(store.autoLoad);
  const [error, setError] = useState<string | null>(null);

  // Lat/Lng tab: one smart box + zoom
  const [coordText, setCoordText] = useState("");
  const [zoomText, setZoomText] = useState("18");
  // Tile tab
  const [tz, setTz] = useState("17");
  const [tx, setTx] = useState("");
  const [ty, setTy] = useState("");
  // Bounds tab (the fork's field order: min lon, min lat, max lon, max lat)
  const [minLon, setMinLon] = useState("");
  const [minLat, setMinLat] = useState("");
  const [maxLon, setMaxLon] = useState("");
  const [maxLat, setMaxLat] = useState("");

  const firstRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    firstRef.current?.focus();
  }, [tab]);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const parsed = useMemo(() => parseLocationInput(coordText), [coordText]);
  const zoom = Number(zoomText);
  const zoomOk = Number.isFinite(zoom) && zoom >= 0 && zoom <= 22;

  // What the Lat/Lng box resolves to — shown live so a bad paste is obvious.
  const latlngTarget: ParsedLocation | null = parsed && parsed.kind === "latlon" ? { ...parsed, zoom: parsed.zoom ?? (zoomOk ? zoom : 18) } : null;
  const tileAtPoint = latlngTarget && zoomOk ? latLonToTile(latlngTarget.lat, latlngTarget.lon, Math.round(zoom)) : null;

  function tileFromFields() {
    return { z: Number(tz), x: Number(tx), y: Number(ty) };
  }
  function boundsFromFields(): Bounds | null {
    const b = { minLon: Number(minLon), minLat: Number(minLat), maxLon: Number(maxLon), maxLat: Number(maxLat) };
    if (![b.minLon, b.minLat, b.maxLon, b.maxLat].every(Number.isFinite)) return null;
    if (!validLatLon(b.minLat, b.minLon) || !validLatLon(b.maxLat, b.maxLon)) return null;
    if (b.minLon >= b.maxLon || b.minLat >= b.maxLat) return null;
    return b;
  }
  const tileBox = validTile(tileFromFields()) ? tileBounds(tileFromFields()) : null;
  const boundsBox = boundsFromFields();
  const activeBox: Bounds | null = tab === "tile" ? tileBox : tab === "bounds" ? boundsBox : null;
  const tooBig = activeBox ? boundsArea(activeBox) > MAX_LOAD_AREA_SQ_DEG : false;

  async function submit() {
    setError(null);
    if (tab === "latlng") {
      // A pasted tile/element/URL in this box is honored too.
      if (parsed && parsed.kind !== "latlon") {
        await goTo(store, parsed, { load });
        onClose();
        return;
      }
      if (!latlngTarget) return setError("Enter coordinates like 9.01997, 38.8014 (also DMS, z/lat/lon, or an OSM link).");
      if (!zoomOk) return setError("Zoom must be between 0 and 22.");
      await goTo(store, latlngTarget, { load });
      onClose();
    } else if (tab === "tile") {
      if (!tileBox) return setError("Not a valid tile: z 0–24, and x, y between 0 and 2^z − 1.");
      await goTo(store, { kind: "tile", tile: tileFromFields() }, { load });
      onClose();
    } else {
      if (!boundsBox) return setError("Bounds need valid min/max lon/lat with min < max.");
      await goTo(store, { kind: "bounds", bounds: boundsBox }, { load });
      onClose();
    }
  }

  // The fork's "set the boundary to the tile containing this lat/lng at this zoom".
  function tileFromPoint() {
    if (!tileAtPoint) return setError("Enter valid coordinates and a zoom first.");
    setTz(String(tileAtPoint.z));
    setTx(String(tileAtPoint.x));
    setTy(String(tileAtPoint.y));
    setTab("tile");
  }

  function drawOnMap() {
    store.setDrawingBoundary(true);
    store.flash("Drag a rectangle on the map to set the boundary (Esc to cancel)");
    onClose();
  }

  const tabButton = (id: Tab, label: string) => (
    <button
      type="button"
      onClick={() => {
        setTab(id);
        setError(null);
      }}
      className={cn(
        "flex-1 rounded-md px-2 py-1 text-[11px] font-medium transition",
        tab === id ? "bg-[color:var(--orange-500)]/15 text-[color:var(--orange-400)]" : "text-[color:var(--text-muted)] hover:bg-[color:var(--surface-3)]",
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[1200] flex items-start justify-center bg-black/40 p-4 pt-24" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form
        className="w-[28rem] max-w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4 text-[12px] shadow-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[color:var(--text-primary)]">
            <Crosshair className="h-3.5 w-3.5" />
            {store.t("dialog.goTo")}
          </span>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-[color:var(--text-muted)] transition hover:bg-[color:var(--surface-3)]">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mb-3 flex gap-1">
          {tabButton("latlng", "Lat / Lng")}
          {tabButton("tile", "Tile (z, x, y)")}
          {tabButton("bounds", "Bounds")}
        </div>

        {tab === "latlng" ? (
          <div className="flex flex-col gap-2">
            <Field label="Coordinates, tile, OSM link or element id">
              <input
                ref={firstRef}
                value={coordText}
                onChange={(e) => setCoordText(e.target.value)}
                placeholder="9.01997, 38.8014"
                className={inputClass}
              />
            </Field>
            <Field label="Zoom">
              <input value={zoomText} onChange={(e) => setZoomText(e.target.value)} inputMode="decimal" className={cn(inputClass, "w-24", !zoomOk && "border-[color:var(--text-danger)]")} />
            </Field>
            <div className="min-h-[2.25rem] rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-2.5 py-1.5 text-[11px] text-[color:var(--text-secondary)]">
              {coordText.trim() === "" ? (
                <span className="text-[color:var(--text-muted)]">
                  Understands <code>9.02, 38.8</code> · <code>9.02 N 38.8 E</code> · <code>9°1′N 38°48′E</code> · <code>17/9.02/38.8</code> · <code>17/79640/62234</code> · <code>w123</code> · an openstreetmap.org link
                </span>
              ) : parsed?.kind === "latlon" ? (
                <>
                  Latitude {parsed.lat.toFixed(6)}, longitude {parsed.lon.toFixed(6)}
                  {tileAtPoint ? <> · tile at z{tileAtPoint.z}: <code>{formatTile(tileAtPoint)}</code></> : null}
                </>
              ) : parsed?.kind === "tile" ? (
                <>Tile <code>{formatTile(parsed.tile)}</code> — will draw it as a boundary</>
              ) : parsed?.kind === "element" ? (
                <>
                  Find {parsed.type} #{parsed.id}
                </>
              ) : (
                <span className="text-[color:var(--text-danger)]">Not recognized as a location.</span>
              )}
            </div>
            <div>
              <button type="button" className={buttonClass} onClick={tileFromPoint} disabled={!tileAtPoint}>
                Use the tile containing this point →
              </button>
            </div>
          </div>
        ) : null}

        {tab === "tile" ? (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-2">
              <Field label="z (zoom)">
                <input ref={firstRef} value={tz} onChange={(e) => setTz(e.target.value)} inputMode="numeric" className={inputClass} />
              </Field>
              <Field label="x">
                <input value={tx} onChange={(e) => setTx(e.target.value)} inputMode="numeric" className={inputClass} />
              </Field>
              <Field label="y">
                <input value={ty} onChange={(e) => setTy(e.target.value)} inputMode="numeric" className={inputClass} />
              </Field>
            </div>
            <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-2.5 py-1.5 font-mono text-[11px] text-[color:var(--text-secondary)]">
              {tileBox ? (
                <>
                  {tileBox.minLat.toFixed(6)}, {tileBox.minLon.toFixed(6)} → {tileBox.maxLat.toFixed(6)}, {tileBox.maxLon.toFixed(6)}
                </>
              ) : (
                <span className="font-sans text-[color:var(--text-muted)]">Enter z, x and y to see the tile&apos;s bounds.</span>
              )}
            </div>
          </div>
        ) : null}

        {tab === "bounds" ? (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Min lon">
                <input ref={firstRef} value={minLon} onChange={(e) => setMinLon(e.target.value)} inputMode="decimal" className={inputClass} />
              </Field>
              <Field label="Min lat">
                <input value={minLat} onChange={(e) => setMinLat(e.target.value)} inputMode="decimal" className={inputClass} />
              </Field>
              <Field label="Max lon">
                <input value={maxLon} onChange={(e) => setMaxLon(e.target.value)} inputMode="decimal" className={inputClass} />
              </Field>
              <Field label="Max lat">
                <input value={maxLat} onChange={(e) => setMaxLat(e.target.value)} inputMode="decimal" className={inputClass} />
              </Field>
            </div>
            <div>
              <button type="button" className={buttonClass} onClick={drawOnMap}>
                Draw a box on the map instead
              </button>
            </div>
          </div>
        ) : null}

        <label className="mt-3 flex items-center gap-2 text-[12px] text-[color:var(--text-primary)]">
          <input type="checkbox" checked={load} onChange={(e) => setLoad(e.target.checked)} />
          Load the map data there
        </label>
        {tooBig && load ? <div className="mt-1 text-[11px] text-[color:var(--text-warning)]">This area is larger than the 0.25 sq° the server allows — it will fly there but can&apos;t load it.</div> : null}
        {error ? <div className="mt-2 text-[11px] text-[color:var(--text-danger)]">{error}</div> : null}

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            className={buttonClass}
            disabled={!store.boundary}
            onClick={() => {
              store.setBoundary(null);
              store.flash("Boundary cleared");
            }}
          >
            Clear boundary
          </button>
          <button type="submit" className={primaryClass}>
            {tab === "latlng" ? "Go" : "Create & fly to"}
          </button>
        </div>
      </form>
    </div>
  );
}
