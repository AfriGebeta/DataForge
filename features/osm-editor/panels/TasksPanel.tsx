"use client";

// Edit tasks in the map editor: your share of the work shows as dots on the map. Click a dot, look at
// its photo, drag the dot onto the real object, check the OSM tags, then Accept (adds a node to the
// working graph and marks the task done) or Skip. Every change is saved to the task as it happens.

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { deleteTaskImage, listTaskImages, taskImageUrl, uploadTaskImage, type TaskImage, type TaskStatus } from "../tasks/api";
import { tagsToText, textToTags, type AssignedFilter } from "../lib/tasks";
import type { EditorStore } from "../useEditorStore";
import PanelShell from "./PanelShell";
import TaskPhotoUploadDialog from "./TaskPhotoUploadDialog";

const btn =
  "rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1.5 text-[12px] font-medium text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-3)] disabled:opacity-40";
const primary =
  "rounded-lg border border-[color:var(--orange-400)]/30 bg-[color:var(--orange-500)]/12 px-3 py-1.5 text-[12px] font-medium text-[color:var(--orange-400)] transition hover:bg-[color:var(--orange-500)]/20 disabled:opacity-40";
const select =
  "rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-2 py-1 text-[12px] text-[color:var(--text-primary)]";
const heading = "text-[10px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]";

function metersBetween(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// The task's photos: the reference to compare against while placing the dot. Whoever works the task can add more.
function TaskPhotos({ taskId, imageCount, canEdit, onChange }: { taskId: number; imageCount: number; canEdit: boolean; onChange: () => void }) {
  const [imgs, setImgs] = useState<TaskImage[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    listTaskImages(taskId)
      .then((r) => live && setImgs(r))
      .catch((e) => live && setErr(e instanceof Error ? e.message : "Load failed"));
    return () => {
      live = false;
    };
  }, [taskId, imageCount]);

  async function upload(files: File[]) {
    if (!files.length) return;
    setBusy(true);
    setErr(null);
    try {
      for (const f of files) await uploadTaskImage(taskId, f);
      onChange();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {imgs.map((im) => (
        <div key={im.id} className="relative">
          <a href={taskImageUrl(im.id)} target="_blank" rel="noreferrer" title="Open full size">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={taskImageUrl(im.id)} alt={`Task ${taskId} photo`} className="w-full rounded-md" />
          </a>
          {canEdit ? (
            <button
              type="button"
              className="absolute right-1 top-1 rounded-full bg-black/60 px-2 text-[12px] text-white"
              title="Remove photo"
              onClick={() => void deleteTaskImage(im.id).then(onChange).catch((e) => setErr(e instanceof Error ? e.message : "Failed"))}
            >
              ×
            </button>
          ) : null}
        </div>
      ))}
      {imgs.length === 0 ? <div className="rounded-md bg-[color:var(--surface-3)] px-2 py-3 text-center text-[11px] text-[color:var(--text-muted)]">No photo for this task</div> : null}
      {canEdit ? (
        <label className={cn(btn, "cursor-pointer text-center")}>
          {busy ? "Uploading…" : "Add photo"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []); // snapshot before the input is cleared
              e.target.value = "";
              void upload(files);
            }}
          />
        </label>
      ) : null}
      {err ? <div className="text-red-400">{err}</div> : null}
    </div>
  );
}

const STATUS_LABEL: Record<TaskStatus, string> = { pending: "Pending", done: "Done (accepted)", skipped: "Skipped" };

export default function TasksPanel({ store, onClose }: { store: EditorStore; onClose: () => void }) {
  const t = store.tasks;
  const { selectedId } = t;
  const sel = selectedId != null ? t.byId.get(selectedId) : undefined;
  // Re-keyed on the selected id, so the tag editor resets to that task's saved tags.
  const [tagState, setTagState] = useState<{ id: number | null; text: string }>({ id: null, text: "" });
  const tagText = tagState.id === selectedId ? tagState.text : sel ? tagsToText(sel.tags) : "";
  const setTagText = (text: string) => setTagState({ id: selectedId, text });
  const [uploadOpen, setUploadOpen] = useState(false);
  const movedBy = sel ? metersBetween([sel.sourceLat, sel.sourceLon], [sel.lat, sel.lon]) : 0;
  const typeOf = (id: string) => t.typeById.get(id);

  async function accept() {
    if (!sel) return;
    if (!store.changeset) {
      store.flash("Start an editing session first — accepting adds a node to the map.");
      return;
    }
    const tags = textToTags(tagText);
    if (Object.keys(tags).length === 0) {
      store.flash("Add at least one tag (key=value) before accepting.");
      return;
    }
    // Mark it done first: the server refuses (e.g. a photo is required) before any node is created.
    const row = await t.save(sel.id, { tags, lat: sel.lat, lon: sel.lon, status: "done" });
    if (!row) return;
    const placeholderId = store.createPoint(sel.lat, sel.lon, tags);
    t.linkNode(store.changeset.id, placeholderId, sel.id); // so Save can record the real node id
    t.setSelectedId(null);
    store.flash("Node added — review and save when ready");
  }

  async function setStatus(status: "pending" | "skipped") {
    if (!sel) return;
    await t.save(sel.id, { status, tags: textToTags(tagText) });
    t.setSelectedId(null);
  }

  return (
    <PanelShell
      title="Edit tasks"
      onClose={() => {
        t.setSelectedId(null);
        t.setOpen(false);
        onClose();
      }}
    >
      {t.error ? <div className="text-red-400">{t.error}</div> : null}

      {t.types.length ? (
        <>
          <div className="text-[10px] text-[color:var(--text-muted)]">
            Dots load from zoom 15{t.loading ? " — loading…" : ""}. Click a dot, drag it onto the real object, check the tags, then Accept. Every change is saved. {t.assigned === "me" ? "Showing your tasks. " : ""}Overall: {t.counts.pending} pending · {t.counts.done} done · {t.counts.skipped} skipped
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn} onClick={() => setUploadOpen(true)}>
              Upload photos…
            </button>
            {t.isAdmin ? (
              <Link className={btn} href="/osm-editor/tasks">
                Manage &amp; assign
              </Link>
            ) : null}
          </div>
          {uploadOpen ? (
            <TaskPhotoUploadDialog
              kinds={t.types}
              getCenter={() => {
                const c = store.mapRef.current?.getCenter();
                return c ? { lat: c.lat, lon: c.lng } : null;
              }}
              onClose={() => setUploadOpen(false)}
              onDone={() => (t.setAssigned("me"), t.setStatus("pending"), t.reload())}
            />
          ) : null}

          {sel ? (
            <div className="flex flex-col gap-2 rounded-lg border border-[color:var(--orange-400)]/30 p-2">
              <div className="flex items-center gap-2 font-semibold text-[color:var(--text-primary)]">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/50" style={{ background: typeOf(sel.type)?.color ?? "#888" }} />
                {typeOf(sel.type)?.label ?? sel.type.replace(/_/g, " ")}
                <span className="ml-auto text-[11px] font-normal text-[color:var(--text-muted)]">#{sel.id}</span>
              </div>
              <TaskPhotos taskId={sel.id} imageCount={sel.imageCount} canEdit={t.isAdmin || sel.status === "pending"} onChange={t.reload} />
              <div className="text-[11px] text-[color:var(--text-muted)]">
                {sel.note ? <div className="break-all">{sel.note}</div> : null}
                <div>
                  {STATUS_LABEL[sel.status]}
                  {sel.osmNodeId ? ` · OSM node ${sel.osmNodeId}` : ""}
                </div>
                <div>
                  {sel.lat.toFixed(6)}, {sel.lon.toFixed(6)}
                  {movedBy > 0.5 ? ` — moved ${movedBy.toFixed(1)} m` : ""}
                </div>
                <a className="underline" target="_blank" rel="noreferrer" href={`https://www.mapillary.com/app/?lat=${sel.sourceLat}&lng=${sel.sourceLon}&z=19`}>
                  Street-level photos here
                </a>
              </div>
              <div className={heading}>OSM tags (key=value per line)</div>
              <textarea
                value={tagText}
                onChange={(e) => setTagText(e.target.value)}
                rows={4}
                spellCheck={false}
                className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-2 py-1 font-mono text-[12px] text-[color:var(--text-primary)] outline-none focus:border-[color:var(--orange-400)]/50"
              />
              <div className="flex flex-wrap gap-2">
                {sel.status === "pending" ? (
                  <>
                    <button type="button" className={primary} onClick={accept}>
                      Accept
                    </button>
                    <button type="button" className={btn} onClick={() => setStatus("skipped")}>
                      Skip
                    </button>
                    <button type="button" className={btn} disabled={movedBy < 0.01} onClick={() => t.resetPosition(sel.id)}>
                      Reset position
                    </button>
                  </>
                ) : (
                  <button type="button" className={btn} onClick={() => setStatus("pending")}>
                    Move back to pending
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-[color:var(--text-muted)]">No dot selected.</div>
          )}

          <div className={heading}>Show</div>
          <select value={t.status} onChange={(e) => (t.setSelectedId(null), t.setStatus(e.target.value as TaskStatus))} className={select}>
            {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <select value={t.assigned} onChange={(e) => (t.setSelectedId(null), t.setAssigned(e.target.value as AssignedFilter))} className={select}>
            <option value="me">Assigned to me</option>
            {t.isAdmin ? <option value="unassigned">Unassigned</option> : null}
            {t.isAdmin ? <option value="all">Everyone</option> : null}
          </select>

          <div className={heading}>Types (pending)</div>
          <div className="flex flex-col gap-1">
            {t.types.map((ty) => (
              <label key={ty.id} className="flex items-center gap-2 text-[12px] text-[color:var(--text-primary)]">
                <input type="checkbox" checked={t.enabledTypes.has(ty.id)} onChange={() => t.toggleType(ty.id)} />
                <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/50" style={{ background: ty.color }} />
                {ty.label}
                <span className="ml-auto tabular-nums text-[color:var(--text-muted)]">{t.typeCounts[ty.id] ?? 0}</span>
              </label>
            ))}
          </div>
        </>
      ) : (
        <div className="text-[color:var(--text-muted)]">Loading…</div>
      )}
    </PanelShell>
  );
}
