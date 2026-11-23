"use client";

// Edit tasks — typed to-do items (traffic light, roundabout, traffic sign, ...) addressed by tile
// z/x/y + coordinate. Admins paste a list, pick a type, select tasks and split them evenly between
// people; everyone else sees their own share and works it in the map editor (Tasks panel): look at the
// photo, drag the dot onto the real object, accept it as an OSM node.

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { fetchUsers } from "@/features/system/users/api";
import type { AdminUser } from "@/features/system/users/types";
import { fetchCurrentAdmin } from "@/features/verification/verification-queue/api";
import { formatMapParam } from "../lib/location";
import { tagsToText, textToTags } from "../lib/tasks";
import {
  createTasks, createTaskType, deleteTask, deleteTaskImage, deleteTaskType, fetchTaskSummary, listTaskImages, listTasks, listTaskTypes,
  parseTaskLines, setTaskStatus, splitAssignTasks, taskImageUrl, unassignTasks, updateTaskType, uploadTaskImage,
  type EditTask, type TaskImage, type TaskStatus, type TaskSummaryRow, type TaskType,
} from "./api";

const PAGE_SIZE = 50;

const input =
  "rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-2.5 py-1.5 text-[12px] text-[color:var(--text-primary)] outline-none focus:border-[color:var(--orange-400)]/50";
const btn =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1.5 text-[12px] font-medium text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-3)] disabled:opacity-40";
const primary = btn + " !bg-[color:var(--orange-400)]/20";

const label = (t: string) => t.replace(/_/g, " ");

// Thumbnails of a task's photos, with upload / remove for whoever may work on it.
function Photos({ task, canEdit, onChange }: { task: EditTask; canEdit: boolean; onChange: () => void }) {
  const [imgs, setImgs] = useState<TaskImage[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void listTaskImages(task.id).then(setImgs).catch((e) => setErr(e instanceof Error ? e.message : "Load failed"));
  }, [task.id, task.imageCount]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setErr(null);
    try {
      for (const f of Array.from(files)) await uploadTaskImage(task.id, f);
      onChange();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      {imgs.map((im) => (
        <div key={im.id} className="relative">
          <a href={taskImageUrl(im.id)} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={taskImageUrl(im.id)} alt={`task ${task.id} photo`} className="h-20 w-20 rounded-md border border-[color:var(--border)] object-cover" />
          </a>
          {canEdit ? (
            <button className="absolute -right-1 -top-1 rounded-full bg-[color:var(--surface-3)] px-1.5 text-[11px]" title="Remove photo"
              onClick={() => void deleteTaskImage(im.id).then(onChange).catch((e) => setErr(e instanceof Error ? e.message : "Failed"))}>×</button>
          ) : null}
        </div>
      ))}
      {canEdit ? (
        <label className={btn + " cursor-pointer"}>
          {busy ? "Uploading…" : "Add photo"}
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" disabled={busy} onChange={(e) => { void upload(e.target.files); e.target.value = ""; }} />
        </label>
      ) : null}
      {!imgs.length && !canEdit ? <span className="text-[color:var(--text-muted)]">No photos.</span> : null}
      {err ? <span className="text-[color:var(--text-danger)]">{err}</span> : null}
    </div>
  );
}
// One task type: whether a photo is required, its colour on the map and the OSM tags a task gets by default.
function TypeRow({ t, busy, onSave, onDelete }: { t: TaskType; busy: boolean; onSave: (requiresImage: boolean, color: string, tags: Record<string, string>) => void; onDelete: () => void }) {
  const [requiresImage, setRequiresImage] = useState(t.requiresImage);
  const [color, setColor] = useState(t.color);
  const [tags, setTags] = useState(tagsToText(t.defaultTags ?? {}));
  const dirty = requiresImage !== t.requiresImage || color !== t.color || tags.trim() !== tagsToText(t.defaultTags ?? {}).trim();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="w-44 font-medium">{t.label}</span>
      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} title="Colour on the map" style={{ width: 36, height: 26, padding: 2 }} className="cursor-pointer rounded border border-[color:var(--border)] bg-transparent" />
      <label className="flex items-center gap-1.5">
        <input type="checkbox" style={{ width: "auto" }} checked={requiresImage} onChange={() => setRequiresImage(!requiresImage)} />
        Requires a photo
      </label>
      <textarea style={{ width: 240, height: 38 }} className={input + " resize-y font-mono"} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="default OSM tags, key=value per line" spellCheck={false} />
      <span className="text-[color:var(--text-muted)]">{t.tasks} tasks</span>
      <button className={primary} disabled={busy || !dirty} onClick={() => onSave(requiresImage, color, textToTags(tags))}>Save</button>
      <button className={btn} disabled={busy || t.tasks > 0} title={t.tasks > 0 ? "Delete its tasks first" : ""} onClick={onDelete}>Delete</button>
    </div>
  );
}

const nameOf = (u: AdminUser) => u.fullName || u.email;
const editorHref = (t: EditTask) => `/osm-editor?panel=tasks&task=${t.id}#map=${formatMapParam(19, t.lat, t.lon)}`;

export default function EditTasksPage() {
  const [me, setMe] = useState<{ id?: string; admin: boolean } | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [summary, setSummary] = useState<TaskSummaryRow[]>([]);
  const [rows, setRows] = useState<EditTask[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState("pending");
  const [assigned, setAssigned] = useState("me");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [workers, setWorkers] = useState<Set<string>>(new Set());
  const [onlyUnassigned, setOnlyUnassigned] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  // New-task form
  const [newType, setNewType] = useState("");
  const [typeList, setTypeList] = useState<TaskType[]>([]);
  const [typeName, setTypeName] = useState("");
  const [typeNeedsImage, setTypeNeedsImage] = useState(false);
  const [openPhotos, setOpenPhotos] = useState<Set<number>>(new Set());
  const [pasted, setPasted] = useState("");

  useEffect(() => {
    void fetchCurrentAdmin()
      .then((m) => {
        const admin = m?.permissionLevel === "ADMIN";
        setMe({ id: m?.adminId, admin });
        setAssigned(admin ? "" : "me");
      })
      .catch(() => setMe({ admin: false }));
  }, []);

  useEffect(() => {
    if (!me) return;
    void listTaskTypes()
      .then((t) => {
        setTypeList(t);
        setNewType((cur) => (t.some((x) => x.id === cur) ? cur : (t[0]?.id ?? "")));
      })
      .catch(() => {});
  }, [me, reloadKey]);

  useEffect(() => {
    if (!me?.admin) return;
    void fetchUsers({ pageSize: 100 })
      .then((r) => setUsers(r.data.filter((u) => u.isActive && (u.role === "ADMIN" || u.role === "DATA_VALIDATOR" || u.role === "DATA_EDITOR"))))
      .catch(() => {});
  }, [me?.admin]);

  useEffect(() => {
    if (!me) return;
    void fetchTaskSummary().then(setSummary).catch(() => {});
    void listTasks({ types: [...types], status, assigned, limit: PAGE_SIZE, offset: page * PAGE_SIZE })
      .then((r) => {
        setRows(r.data);
        setTotal(r.total);
      })
      .catch((e) => setMsg(e instanceof Error ? e.message : "Load failed"));
  }, [me, types, status, assigned, page, reloadKey]);

  const typeLabel = useCallback((id: string) => typeList.find((t) => t.id === id)?.label ?? label(id), [typeList]);
  const typeCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of summary) m.set(s.type, (m.get(s.type) ?? 0) + s.pending);
    return m;
  }, [summary]);

  const flip = <T,>(s: Set<T>, v: T) => {
    const n = new Set(s);
    if (!n.delete(v)) n.add(v);
    return n;
  };
  const parsed = useMemo(() => parseTaskLines(pasted), [pasted]);

  async function run(fn: () => Promise<string>) {
    setBusy(true);
    setMsg(null);
    try {
      setMsg(await fn());
      setSelected(new Set());
      reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const add = () =>
    run(async () => {
      const r = await createTasks(newType, parsed.tasks);
      setPasted("");
      return `Added ${r.created} ${typeLabel(newType).toLowerCase()} tasks${r.duplicates ? ` (${r.duplicates} already existed)` : ""}`;
    });

  // The split acts on the ticked rows if any, otherwise on every pending task of the ticked types.
  const sel = selected.size ? { ids: [...selected] } : { types: [...types] };
  const hasSel = selected.size > 0 || types.size > 0;
  const pool = selected.size || [...types].reduce((n, t) => n + (typeCounts.get(t) ?? 0), 0);

  const split = () =>
    run(async () => {
      const r = await splitAssignTasks(sel, [...workers], onlyUnassigned);
      return `Assigned ${r.total} tasks to ${Object.keys(r.perWorker).length} people`;
    });
  const takeBack = () => run(async () => `Took back ${(await unassignTasks(sel)).unassigned} tasks`);
  const mark = (t: EditTask, s: TaskStatus) =>
    run(async () => {
      await setTaskStatus(t.id, s);
      return `Task #${t.id} marked ${s}`;
    });

  const progress = useMemo(() => {
    const m = new Map<string, { name: string; pending: number; done: number }>();
    for (const s of summary) {
      const k = s.workerId ?? "none";
      const p = m.get(k) ?? { name: s.workerName ?? "Unassigned", pending: 0, done: 0 };
      p.pending += s.pending;
      p.done += s.done;
      m.set(k, p);
    }
    return [...m.values()];
  }, [summary]);

  if (!me) return <div className="p-6 text-[12px] text-[color:var(--text-muted)]">Loading…</div>;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 p-6 text-[12px] text-[color:var(--text-primary)]">
      <h1 className="text-lg font-semibold">Edit tasks</h1>
      {msg ? <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2">{msg}</div> : null}

      {me.admin ? (
        <details className="rounded-lg border border-[color:var(--border)] p-3">
          <summary className="cursor-pointer font-semibold">Task types (admin)</summary>
          <div className="mt-3 flex flex-col gap-2">
            {typeList.map((t) => (
              <TypeRow key={t.id} t={t} busy={busy}
                onSave={(requiresImage, color, tags) => run(async () => (await updateTaskType(t.id, t.label, requiresImage, { color, defaultTags: tags }), `Saved ${t.label}`))}
                onDelete={() => run(async () => (await deleteTaskType(t.id), `Deleted type ${t.label}`))} />
            ))}
            <div className="flex flex-wrap items-center gap-3 border-t border-[color:var(--border)] pt-2">
              <input className={input} placeholder="New type, e.g. Bus stop" value={typeName} onChange={(e) => setTypeName(e.target.value)} />
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={typeNeedsImage} onChange={() => setTypeNeedsImage(!typeNeedsImage)} />
                Mapper must upload a photo
              </label>
              <button className={primary} disabled={busy || !typeName.trim()}
                onClick={() => run(async () => {
                  const r = await createTaskType(typeName.trim(), typeNeedsImage);
                  setTypeName("");
                  setTypeNeedsImage(false);
                  setNewType(r.id);
                  return `Created type ${typeName.trim()}`;
                })}>Create type</button>
            </div>
          </div>
        </details>
      ) : null}

      {me.admin ? (
        <details className="rounded-lg border border-[color:var(--border)] p-3" open>
          <summary className="cursor-pointer font-semibold">Add tasks (admin)</summary>
          <div className="mt-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span>Type</span>
              <select className={input} value={newType} onChange={(e) => setNewType(e.target.value)}>
                {typeList.map((t) => <option key={t.id} value={t.id}>{t.label}{t.requiresImage ? " (photo)" : ""}</option>)}
              </select>
            </div>
            <textarea
              className={input + " h-32 font-mono"}
              placeholder={"One per line:  z,x,y   |   z,x,y,lat,lon   |   lat,lon\n17,80123,60456\n17,80124,60456,9.0123,38.7456\n9.0123,38.7456"}
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
            />
            <div className="text-[color:var(--text-muted)]">For z,x,y without lat,lon the coordinate is the tile centre. A bare lat,lon line is used as-is.</div>
            {parsed.errors.slice(0, 5).map((e) => <div key={e} className="text-[color:var(--text-danger)]">{e}</div>)}
            <div>
              <button className={primary} disabled={busy || !parsed.tasks.length || !!parsed.errors.length || !newType} onClick={add}>
                Add {parsed.tasks.length || ""} {typeLabel(newType).toLowerCase()} tasks
              </button>
            </div>
          </div>
        </details>
      ) : null}

      {me.admin ? (
        <details className="rounded-lg border border-[color:var(--border)] p-3" open>
          <summary className="cursor-pointer font-semibold">Split between people (admin)</summary>
          <div className="mt-3 flex flex-col gap-2">
            <div className="text-[color:var(--text-muted)]">
              Tick tasks in the list below — or just tick types in the filter — then pick people. Tasks are cut into west→east tile strips.
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {users.map((u) => (
                <label key={u.id} className="flex items-center gap-1.5">
                  <input type="checkbox" checked={workers.has(u.id)} onChange={() => setWorkers(flip(workers, u.id))} />
                  {nameOf(u)}
                </label>
              ))}
            </div>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={onlyUnassigned} onChange={() => setOnlyUnassigned(!onlyUnassigned)} />
              Keep what is already assigned
            </label>
            <div className="text-[color:var(--text-muted)]">
              {hasSel && workers.size
                ? `${pool} tasks ÷ ${workers.size} people ≈ ${Math.ceil(pool / workers.size)} each`
                : "Pick tasks (or types) and at least one person."}
            </div>
            <div className="flex gap-2">
              <button className={primary} disabled={busy || !hasSel || !workers.size} onClick={split}>Split evenly</button>
              <button className={btn} disabled={busy || !hasSel} onClick={takeBack}>Take back</button>
            </div>
            <div className="mt-1 grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-2">
              {progress.map((p) => (
                <div key={p.name} className="rounded-md border border-[color:var(--border)] px-2 py-1.5">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-[color:var(--text-muted)]">{p.done} done · {p.pending} pending</div>
                </div>
              ))}
            </div>
          </div>
        </details>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {typeList.map((ty) => ty.id).map((t) => (
          <label key={t} className="flex items-center gap-1.5">
            <input type="checkbox" checked={types.has(t)} onChange={() => (setPage(0), setTypes(flip(types, t)))} />
            {typeLabel(t)} <span className="text-[color:var(--text-muted)]">{typeCounts.get(t) ?? 0}</span>
          </label>
        ))}
        <select className={input} value={status} onChange={(e) => (setPage(0), setStatus(e.target.value))}>
          <option value="pending">Pending</option>
          <option value="done">Done</option>
          <option value="skipped">Skipped</option>
          <option value="">Any status</option>
        </select>
        <select className={input} value={assigned} onChange={(e) => (setPage(0), setAssigned(e.target.value))}>
          <option value="me">Assigned to me</option>
          {me.admin ? <option value="">Anyone</option> : null}
          {me.admin ? <option value="unassigned">Unassigned</option> : null}
          {me.admin ? users.map((u) => <option key={u.id} value={u.id}>{nameOf(u)}</option>) : null}
        </select>
      </div>

      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-[color:var(--border)] text-[color:var(--text-muted)]">
            {me.admin ? (
              <th className="w-8 py-1.5">
                <input type="checkbox" checked={rows.length > 0 && rows.every((r) => selected.has(r.id))}
                  onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())} />
              </th>
            ) : null}
            <th>#</th><th>Type</th><th>Coordinate</th><th>Assigned</th><th>Status</th><th>OSM</th><th />
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => {
            const mine = me.admin || t.assignedToId === me.id;
            return (
            <Fragment key={t.id}>
            <tr className="border-b border-[color:var(--border)]/50">
              {me.admin ? <td className="py-1.5"><input type="checkbox" checked={selected.has(t.id)} onChange={() => setSelected(flip(selected, t.id))} /></td> : null}
              <td className="py-1.5">{t.id}</td>
              <td>{typeLabel(t.type)}{t.requiresImage ? <span title="needs a photo"> 📷 {t.imageCount}</span> : t.imageCount ? <span> 📷 {t.imageCount}</span> : null}</td>
              <td className="font-mono">{t.lat.toFixed(6)}, {t.lon.toFixed(6)}</td>
              <td>{t.assignedToName ?? <span className="text-[color:var(--text-muted)]">—</span>}</td>
              <td>{t.status}</td>
              <td>{t.osmNodeId ? <span title="accepted and saved as this OSM node">node {t.osmNodeId}</span> : <span className="text-[color:var(--text-muted)]">—</span>}</td>
              <td className="flex justify-end gap-1.5 py-1">
                <Link className={btn} href={editorHref(t)}><MapPin size={12} /> Open</Link>
                {t.requiresImage || t.imageCount > 0 ? (
                  <button className={btn} onClick={() => setOpenPhotos(flip(openPhotos, t.id))}>Photos</button>
                ) : null}
                {t.status === "pending" && (mine || assigned === "me") ? (
                  <>
                    <button className={primary} disabled={busy || (t.requiresImage && t.imageCount === 0)}
                      title={t.requiresImage && t.imageCount === 0 ? "Add a photo first" : ""} onClick={() => mark(t, "done")}>Done</button>
                    <button className={btn} disabled={busy} onClick={() => mark(t, "skipped")}>Skip</button>
                  </>
                ) : t.status !== "pending" ? (
                  <button className={btn} disabled={busy} onClick={() => mark(t, "pending")}>Reopen</button>
                ) : null}
                {me.admin ? (
                  <button className={btn} disabled={busy} onClick={() => run(async () => {
                    const withNode = !!t.osmNodeId && window.confirm(`Task #${t.id} was accepted as OSM node ${t.osmNodeId}.\n\nOK = delete the task AND the OSM node.\nCancel = delete only the task.`);
                    const r = await deleteTask(t.id, withNode);
                    return `Deleted #${t.id}${r.osmNodeDeleted ? " and its OSM node" : ""}`;
                  })}>Delete</button>
                ) : null}
              </td>
            </tr>
            {openPhotos.has(t.id) ? (
              <tr className="border-b border-[color:var(--border)]/50">
                <td colSpan={9}><Photos task={t} canEdit={mine} onChange={reload} /></td>
              </tr>
            ) : null}
            </Fragment>
            );
          })}
          {!rows.length ? <tr><td colSpan={9} className="py-6 text-center text-[color:var(--text-muted)]">No tasks.</td></tr> : null}
        </tbody>
      </table>

      <div className="flex items-center gap-2">
        <button className={btn} disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</button>
        <span>Page {page + 1} / {pages} · {total} tasks</span>
        <button className={btn} disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}
