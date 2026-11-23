"use client";

// Popup for uploading your own photos. For every photo you say what it shows (traffic light,
// crossing, sign … or Other) and where it is (latitude / longitude — pre-filled from the middle of
// the map, so you only change them if you know the spot). It is saved as a new edit task assigned to
// you; you can still drag the dot onto the exact position afterwards.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createTaskFromPhoto, type TaskType } from "../tasks/api";

type Status = "queued" | "uploading" | "done" | "error";
interface Item {
  file: File;
  preview: string;
  kind: string; // "" = not chosen yet
  lat: string;
  lon: string;
  status: Status;
  message?: string;
}

const EXT_RE = /\.(jpe?g|png|webp)$/i;
const CONCURRENCY = 3;

const btn =
  "rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1.5 text-[12px] font-medium text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-3)] disabled:opacity-40";
const primary =
  "rounded-lg border border-[color:var(--orange-400)]/30 bg-[color:var(--orange-500)]/12 px-3 py-1.5 text-[12px] font-medium text-[color:var(--orange-400)] transition hover:bg-[color:var(--orange-500)]/20 disabled:opacity-40";
const field =
  "rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-2 py-1 text-[12px] text-[color:var(--text-primary)] outline-none focus:border-[color:var(--orange-400)]/50";

const num = (s: string) => (s.trim() === "" ? NaN : Number(s));
const validLat = (s: string) => Number.isFinite(num(s)) && Math.abs(num(s)) <= 90;
const validLon = (s: string) => Number.isFinite(num(s)) && Math.abs(num(s)) <= 180;

export default function TaskPhotoUploadDialog({
  kinds,
  getCenter,
  onClose,
  onDone,
}: {
  kinds: TaskType[];
  getCenter: () => { lat: number; lon: number } | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [running, setRunning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [bulkKind, setBulkKind] = useState("");
  const [bulkLat, setBulkLat] = useState("");
  const [bulkLon, setBulkLon] = useState("");
  const previews = useRef<string[]>([]);

  useEffect(() => () => previews.current.forEach((u) => URL.revokeObjectURL(u)), []);

  function add(incoming: FileList | File[]) {
    const files = Array.from(incoming); // snapshot NOW: a drop's DataTransfer and the input's FileList are emptied after the event
    if (files.length === 0) return;
    const c = getCenter();
    setItems((cur) => {
      const next: Item[] = files.map((file, k) => {
        const preview = URL.createObjectURL(file);
        previews.current.push(preview);
        const n = cur.length + k;
        // Pre-fill from the map centre, fanned out ~4 m apart so photos don't pile on one spot.
        const lat = c ? (c.lat - Math.floor(n / 5) * 0.00004).toFixed(6) : "";
        const lon = c ? (c.lon + (n % 5) * 0.00004).toFixed(6) : "";
        if (!EXT_RE.test(file.name)) return { file, preview, kind: "", lat, lon, status: "error", message: "not a JPEG, PNG or WebP image" };
        return { file, preview, kind: bulkKind, lat: bulkLat || lat, lon: bulkLon || lon, status: "queued" };
      });
      return [...cur, ...next];
    });
  }
  const set = (file: File, patch: Partial<Item>) => setItems((cur) => cur.map((i) => (i.file === file ? { ...i, ...patch } : i)));
  const open = (i: Item) => i.status === "queued" || i.status === "error";
  const applyKind = (kind: string) => (setBulkKind(kind), setItems((cur) => cur.map((i) => (open(i) ? { ...i, kind } : i))));
  const applyCoords = () => setItems((cur) => cur.map((i) => (open(i) ? { ...i, lat: bulkLat || i.lat, lon: bulkLon || i.lon } : i)));
  const useCentre = () => {
    const c = getCenter();
    if (c) (setBulkLat(c.lat.toFixed(6)), setBulkLon(c.lon.toFixed(6)));
  };

  const imageOk = (i: Item) => EXT_RE.test(i.file.name);
  const ready = (i: Item) => open(i) && imageOk(i) && i.kind !== "" && validLat(i.lat) && validLon(i.lon);
  const needType = items.filter((i) => open(i) && imageOk(i) && i.kind === "").length;
  const needCoords = items.filter((i) => open(i) && imageOk(i) && !(validLat(i.lat) && validLon(i.lon))).length;
  const toUpload = items.filter(ready).length;

  async function start() {
    setRunning(true);
    const queue = items.filter(ready);
    let next = 0;
    async function worker() {
      while (next < queue.length) {
        const it = queue[next++];
        set(it.file, { status: "uploading", message: undefined });
        try {
          await createTaskFromPhoto(it.kind, num(it.lat), num(it.lon), it.file);
          set(it.file, { status: "done" });
        } catch (e) {
          set(it.file, { status: "error", message: e instanceof Error ? e.message : "failed" });
        }
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    setRunning(false);
    onDone();
  }

  const done = items.filter((i) => i.status === "done").length;
  const failed = items.filter((i) => i.status === "error").length;

  // Portalled to <body>: the side panel has backdrop-filter, which would otherwise become the
  // containing block of this `fixed` overlay and squash it into the panel's 320px column.
  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4" onClick={() => !running && onClose()}>
      <div className="flex h-[90vh] w-full max-w-5xl flex-col gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[color:var(--text-primary)]">Upload photos</h2>
          <button type="button" className={btn} disabled={running} onClick={onClose}>
            Close
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-[color:var(--border)] p-2 text-[12px] text-[color:var(--text-primary)]">
          <span className="font-medium">Set for all photos:</span>
          <label className="flex items-center gap-1.5">
            Type
            <select value={bulkKind} onChange={(e) => applyKind(e.target.value)} className={field}>
              <option value="">— choose —</option>
              {kinds.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            Latitude
            <input value={bulkLat} onChange={(e) => setBulkLat(e.target.value)} placeholder="9.030000" className={`${field} w-28`} inputMode="decimal" />
          </label>
          <label className="flex items-center gap-1.5">
            Longitude
            <input value={bulkLon} onChange={(e) => setBulkLon(e.target.value)} placeholder="38.750000" className={`${field} w-28`} inputMode="decimal" />
          </label>
          <button type="button" className={btn} onClick={applyCoords} disabled={!validLat(bulkLat) || !validLon(bulkLon)}>
            Apply to all
          </button>
          <button type="button" className={btn} onClick={useCentre}>
            Use map centre
          </button>
        </div>

        <label
          onDragOver={(e) => (e.preventDefault(), setDragOver(true))}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => (e.preventDefault(), setDragOver(false), add(e.dataTransfer.files))}
          className={`block cursor-pointer rounded-lg border-2 border-dashed px-4 py-5 text-center text-[12px] text-[color:var(--text-muted)] ${dragOver ? "border-[color:var(--orange-400)] bg-[color:var(--orange-500)]/10" : "border-[color:var(--border)]"}`}
        >
          <span className="inline-block rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1.5 text-[12px] font-medium text-[color:var(--text-primary)]">Choose photos…</span>
          <div className="mt-2">or drop photos here</div>
          <div className="mt-1 text-[11px]">JPEG, PNG or WebP, up to 20 MB each. Latitude and longitude start at the map centre; type the real ones if you know them.</div>
          {/* A native <label> opens the picker itself — no script click() that could be swallowed or re-entered. */}
          <input type="file" multiple accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" className="sr-only" onChange={(e) => (add(e.target.files ?? []), (e.target.value = ""))} />
        </label>

        <div className="text-[11px] text-[color:var(--text-muted)]">
          {items.length} photos · {done} uploaded · {failed} failed
          {needType ? ` · ${needType} need a type` : ""}
          {needCoords ? ` · ${needCoords} need valid coordinates` : ""}
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto rounded-md border border-[color:var(--border)] text-[12px]">
          {items.length === 0 ? <li className="p-6 text-center text-[color:var(--text-muted)]">No photos yet.</li> : null}
          {items.map((i, n) => (
            <li key={n} className="flex items-center gap-3 border-b border-[color:var(--border)] p-2 last:border-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={i.preview} alt="" className="h-16 w-24 shrink-0 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[color:var(--text-primary)]">{i.file.name}</div>
                {i.status === "error" ? <div className="truncate text-red-400" title={i.message}>{i.message}</div> : null}
              </div>
              {i.status === "done" ? (
                <span className="text-green-500">uploaded</span>
              ) : (
                <>
                  <select value={i.kind} disabled={running || i.status === "uploading"} onChange={(e) => set(i.file, { kind: e.target.value })} className={`${field} ${i.kind === "" ? "border-red-400/60" : ""}`}>
                    <option value="">type…</option>
                    {kinds.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                  <input value={i.lat} disabled={running} onChange={(e) => set(i.file, { lat: e.target.value })} placeholder="latitude" inputMode="decimal" className={`${field} w-28 ${validLat(i.lat) ? "" : "border-red-400/60"}`} />
                  <input value={i.lon} disabled={running} onChange={(e) => set(i.file, { lon: e.target.value })} placeholder="longitude" inputMode="decimal" className={`${field} w-28 ${validLon(i.lon) ? "" : "border-red-400/60"}`} />
                  {i.status === "uploading" ? <span className="text-[color:var(--text-muted)]">uploading…</span> : null}
                </>
              )}
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-end gap-2">
          <button type="button" className={btn} disabled={running || !items.length} onClick={() => setItems([])}>
            Clear
          </button>
          <button type="button" className={primary} disabled={running || toUpload === 0 || needType > 0 || needCoords > 0} onClick={start}>
            {running ? "Uploading…" : `Upload ${toUpload || ""}`.trim()}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
