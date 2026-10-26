"use client";

// Auto-trace — ported from the Gebeta iD fork's "auto segment" tool. Pick an
// area, and the roads in it are traced from a road-mask raster (roads white
// on black): tiles are stitched into one image, the Python segmenter
// skeletonizes it, and the resulting lines come back here as a preview you
// accept (becoming ways, snapped onto existing nodes/roads) or discard.
//
// The mask comes from Google's road-mask layer (needs the server's
// GOOGLE_MAPS_API_KEY) or any XYZ template of your own.

import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/lib/api-config";
import { cn } from "@/lib/utils";
import { segmentArea } from "../api";
import { boundsToPixelPolygon, chooseMosaic, lineLengthMeters, pathsToLatLon, TILE_PX, traceToGraph, type MosaicPlan } from "../lib/autotrace";
import { GOOGLE_IMAGERY, resolveTileUrl, validCustomTemplate } from "../lib/imagery";
import type { EditorStore } from "../useEditorStore";
import PanelShell from "./PanelShell";

const MASK_URL_KEY = "osm-editor:trace-mask-url";
const inputClass =
  "w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-2 py-1 text-[12px] text-[color:var(--text-primary)] outline-none focus:border-[color:var(--orange-400)]/50";
const btn =
  "rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1.5 text-[12px] font-medium text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-3)] disabled:opacity-40";
const primary =
  "rounded-lg border border-[color:var(--orange-400)]/30 bg-[color:var(--orange-500)]/12 px-3 py-1.5 text-[12px] font-medium text-[color:var(--orange-400)] transition hover:bg-[color:var(--orange-500)]/20 disabled:opacity-40";

type Source = "google" | "custom";

const ROAD_TAGS: { label: string; tags: Record<string, string> }[] = [
  { label: "highway=road (type unknown — review later)", tags: { highway: "road" } },
  { label: "highway=unclassified", tags: { highway: "unclassified" } },
  { label: "highway=residential", tags: { highway: "residential" } },
  { label: "highway=service", tags: { highway: "service" } },
];

function readSavedMaskUrl(): string {
  try {
    return window.localStorage.getItem(MASK_URL_KEY) ?? "";
  } catch {
    return "";
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // required to read the pixels back off the canvas
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("a tile failed to load"));
    img.src = url;
  });
}

// Expand the template for one tile. {s} gets a fixed subdomain.
function tileUrl(template: string, z: number, x: number, y: number): string {
  return template.replace("{z}", String(z)).replace("{x}", String(x)).replace("{y}", String(y)).replace("{s}", "a").replace("{r}", "");
}

export default function AutoTracePanel({ store, onClose }: { store: EditorStore; onClose: () => void }) {
  const [source, setSource] = useState<Source>(store.googleTiles ? "google" : "custom");
  const [customUrl, setCustomUrl] = useState(readSavedMaskUrl);
  const [tagIndex, setTagIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<MosaicPlan | null>(null);

  const box = store.traceBox;
  const preview = store.tracePreview;
  const mosaic = useMemo(() => (box ? chooseMosaic(box) : null), [box]);
  const customOk = validCustomTemplate(customUrl);
  const sourceOk = source === "google" ? store.googleTiles : customOk;
  const totalMeters = useMemo(() => (preview ? preview.reduce((n, l) => n + lineLengthMeters(l), 0) : 0), [preview]);

  // Leaving the panel while picking a box would strand the drag mode.
  const { setTracePicking } = store;
  useEffect(() => () => setTracePicking(false), [setTracePicking]);

  async function run() {
    if (!box || !mosaic) return;
    setBusy(true);
    setError(null);
    store.setTracePreview(null);
    try {
      const template = source === "google" ? resolveTileUrl(GOOGLE_IMAGERY[2], API_BASE_URL) : customUrl;
      const canvas = document.createElement("canvas");
      canvas.width = mosaic.width;
      canvas.height = mosaic.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("this browser can't create a drawing canvas");
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const jobs: Promise<void>[] = [];
      for (let r = 0; r < mosaic.rows; r++) {
        for (let c = 0; c < mosaic.cols; c++) {
          jobs.push(loadImage(tileUrl(template, mosaic.z, mosaic.x0 + c, mosaic.y0 + r)).then((img) => ctx.drawImage(img, c * TILE_PX, r * TILE_PX, TILE_PX, TILE_PX)));
        }
      }
      await Promise.all(jobs);

      let dataUrl: string;
      try {
        dataUrl = canvas.toDataURL("image/png");
      } catch {
        throw new Error("the tile server doesn't allow reading its pixels (it needs CORS headers: Access-Control-Allow-Origin)");
      }
      const paths = await segmentArea(dataUrl, boundsToPixelPolygon(mosaic, box), { width: mosaic.width, height: mosaic.height });
      const lines = pathsToLatLon(mosaic, paths);
      setPlan(mosaic);
      store.setTracePreview(lines);
      if (lines.length === 0) setError("No roads were found in that area. Is the mask source showing roads there?");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tracing failed");
    } finally {
      setBusy(false);
    }
  }

  function accept() {
    if (!preview || preview.length === 0) return;
    if (!store.changeset) {
      setError("Start an editing session first — tracing adds roads to the map.");
      return;
    }
    const result = traceToGraph(store.graph, preview, (t) => store.allocateId(t), { tags: ROAD_TAGS[tagIndex].tags });
    if (result.wayIds.length === 0) {
      setError("Nothing to add — the traced lines collapsed into existing nodes.");
      return;
    }
    store.commitGraph(result.graph);
    store.setTracePreview(null);
    store.setTraceBox(null);
    setError(null);
    store.flash(`Added ${result.wayIds.length} road${result.wayIds.length === 1 ? "" : "s"}${result.waysConnected ? `, connected to ${result.waysConnected} existing way${result.waysConnected === 1 ? "" : "s"}` : ""} — review before saving`);
  }

  function discard() {
    store.setTracePreview(null);
    store.setTraceBox(null);
    setError(null);
    setPlan(null);
  }

  return (
    <PanelShell title={store.t("panel.autoTrace")} onClose={() => (discard(), onClose())}>
      <div className="text-[11px] text-[color:var(--text-muted)]">Draw a box over some roads. They&apos;re traced from a road-mask image, then shown here for you to accept or discard.</div>

      <div className="flex flex-col gap-1.5">
        <label className="flex items-start gap-2 text-[12px]">
          <input type="radio" className="mt-0.5" checked={source === "google"} disabled={!store.googleTiles} onChange={() => setSource("google")} />
          <span>
            <span className={cn("block", !store.googleTiles && "text-[color:var(--text-muted)]")}>Google road mask</span>
            <span className="block text-[10px] text-[color:var(--text-muted)]">{store.googleTiles ? "Via your server's Google Maps key." : "Unavailable — the server has no GOOGLE_MAPS_API_KEY."}</span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-[12px]">
          <input type="radio" className="mt-0.5" checked={source === "custom"} onChange={() => setSource("custom")} />
          <span className="min-w-0 flex-1">
            <span className="block">My own mask tiles</span>
            <span className="block text-[10px] text-[color:var(--text-muted)]">An XYZ URL whose tiles show roads white on black, served with CORS.</span>
          </span>
        </label>
        {source === "custom" ? (
          <input
            value={customUrl}
            onChange={(e) => {
              setCustomUrl(e.target.value);
              try {
                window.localStorage.setItem(MASK_URL_KEY, e.target.value);
              } catch {
                // remembering the URL is a convenience only
              }
            }}
            placeholder="https://tiles.example.com/{z}/{x}/{y}.png"
            className={cn(inputClass, customUrl && !customOk && "border-[color:var(--text-danger)]")}
          />
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <button type="button" className={store.tracePicking ? primary : btn} onClick={() => store.setTracePicking(!store.tracePicking)}>
          {store.tracePicking ? "Drag a box on the map… (Esc)" : box ? "Redraw the area" : "Draw the area"}
        </button>
        {box ? (
          mosaic ? (
            <span className="text-[10px] text-[color:var(--text-muted)]">
              z{mosaic.z} · {mosaic.cols}×{mosaic.rows} tiles
            </span>
          ) : (
            <span className="text-[10px] text-[color:var(--text-danger)]">Too large — draw a smaller box.</span>
          )
        ) : null}
      </div>

      <button type="button" className={primary} disabled={busy || !box || !mosaic || !sourceOk} onClick={() => void run()}>
        {busy ? "Tracing…" : "Trace roads in this area"}
      </button>

      {preview && preview.length > 0 ? (
        <div className="flex flex-col gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] p-2">
          <div className="text-[12px] text-[color:var(--text-primary)]">
            Found {preview.length} road{preview.length === 1 ? "" : "s"}, about {totalMeters >= 1000 ? `${(totalMeters / 1000).toFixed(2)} km` : `${Math.round(totalMeters)} m`}
            {plan ? <span className="text-[color:var(--text-muted)]"> (z{plan.z})</span> : null}.
          </div>
          <select value={tagIndex} onChange={(e) => setTagIndex(Number(e.target.value))} className={inputClass}>
            {ROAD_TAGS.map((t, i) => (
              <option key={t.label} value={i}>
                {t.label}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2">
            <button type="button" className={btn} onClick={discard}>
              Discard
            </button>
            <button type="button" className={primary} onClick={accept}>
              Add to the map
            </button>
          </div>
        </div>
      ) : null}

      {error ? <div className="text-[11px] text-[color:var(--text-danger)]">{error}</div> : null}
      <div className="text-[10px] text-[color:var(--text-muted)]">Needs the segmentation service running on the server (python3 scripts/segment_api.py). Always check the result against imagery before saving.</div>
    </PanelShell>
  );
}
