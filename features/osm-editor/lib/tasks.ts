"use client";

// Edit tasks in the map editor — state for the "Tasks" panel + map layer.
//
// Tasks live in PlaceForge's `edit_task` table (photos in `edit_task_image`). The layer loads the
// tasks in view that belong to you; dragging a dot, editing its tags, Accept and Skip are each saved
// straight back to that table. Type colours and default tags come from `edit_task_type`.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchCurrentAdmin } from "@/features/verification/verification-queue/api";
import { fetchTaskSummary, listTasksInBounds, listTaskTypes, patchTask, type EditTask, type TaskPatch, type TaskStatus, type TaskSummaryRow, type TaskType } from "../tasks/api";
import type { Bounds } from "./location";

export type { EditTask, TaskType };
export type AssignedFilter = "me" | "unassigned" | "all";

// Accepted tasks whose node is still a placeholder (negative id) in an unsaved changeset.
// Keyed by "<changesetId>:<placeholderId>" so ids from an abandoned session can never be mistaken.
const LINKS_KEY = "osm-editor:task-node-links";

function readLinks(): Record<string, number> {
  try {
    return JSON.parse(window.localStorage.getItem(LINKS_KEY) ?? "{}");
  } catch {
    return {};
  }
}
function writeLinks(links: Record<string, number>) {
  try {
    window.localStorage.setItem(LINKS_KEY, JSON.stringify(links));
  } catch {
    /* private mode — the node will simply not be linked back */
  }
}

export function tagsToText(tags: Record<string, string>): string {
  return Object.entries(tags)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
}

export function textToTags(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const i = line.indexOf("=");
    if (i <= 0) continue;
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim();
    if (k && v) out[k] = v;
  }
  return out;
}

export function useEditTasks() {
  const [open, setOpen] = useState(false); // layer visible
  const [types, setTypes] = useState<TaskType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [enabledTypes, setEnabledTypes] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<TaskStatus>("pending");
  // Workers see only their own share by default; admins (who hand the work out) see everything.
  const [assigned, setAssigned] = useState<AssignedFilter>("me");
  const [isAdmin, setIsAdmin] = useState(false);
  const [items, setItems] = useState<EditTask[]>([]);
  const [summary, setSummary] = useState<TaskSummaryRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [bounds, setBounds] = useState<Bounds | null>(null); // last in-view box (null when zoomed out)
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  const typesLoaded = useRef(false);

  // Task types (colour, default tags), once, on first open.
  useEffect(() => {
    if (!open || typesLoaded.current) return;
    typesLoaded.current = true;
    listTaskTypes()
      .then((t) => {
        setTypes(t);
        setEnabledTypes(new Set(t.map((x) => x.id)));
      })
      .catch((e) => {
        typesLoaded.current = false;
        setError(`Could not load task types: ${e instanceof Error ? e.message : e}`);
      });
  }, [open]);

  const refreshStats = useCallback(() => {
    fetchTaskSummary()
      .then(setSummary)
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!open) return;
    void fetchCurrentAdmin().then((me) => {
      const admin = me?.permissionLevel === "ADMIN";
      setIsAdmin(admin);
      if (admin) setAssigned("all");
    });
  }, [open]);
  useEffect(() => {
    if (!open) return;
    // Fetching from the API is the "external system" this effect syncs with.
    refreshStats();
  }, [open, refreshStats, reloadKey]);

  // Reload from the table whenever the view or a filter changes (debounced; stale requests aborted).
  const typesKey = useMemo(() => [...enabledTypes].sort().join(","), [enabledTypes]);
  useEffect(() => {
    if (!open || !bounds || types.length === 0 || enabledTypes.size === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems([]);
      return;
    }
    const ctl = new AbortController();
    const t = setTimeout(() => {
      setLoading(true);
      setError(null);
      listTasksInBounds(bounds, { types: [...enabledTypes], status, assigned: assigned === "all" ? "" : assigned }, ctl.signal)
        .then((r) => setItems(r.data))
        .catch((e) => {
          if (e?.name !== "AbortError") setError(e instanceof Error ? e.message : String(e));
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
    // typesKey stands in for the Set so identical selections don't refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, bounds, types, typesKey, status, assigned, reloadKey]);

  const linkNode = useCallback((changesetId: number, placeholderId: number, taskId: number) => {
    writeLinks({ ...readLinks(), [`${changesetId}:${placeholderId}`]: taskId });
  }, []);

  // Called after a successful Save: nodes that got their real OSM id are recorded on their task,
  // which is what makes a task show as "synced with OSM". Returns how many were linked.
  const syncSaved = useCallback(async (changesetId: number, results: { type: string; oldId: number; newId: number }[]): Promise<number> => {
    const links = readLinks();
    let n = 0;
    for (const r of results) {
      const key = `${changesetId}:${r.oldId}`;
      if (r.type !== "node" || r.oldId >= 0 || !links[key]) continue;
      try {
        await patchTask(links[key], { osmNodeId: r.newId });
        delete links[key];
        n++;
      } catch {
        /* keep the link; it can be retried on the next save */
      }
    }
    writeLinks(links);
    return n;
  }, []);

  const byId = useMemo(() => new Map(items.map((r) => [r.id, r])), [items]);

  // A link from the task list ("?task=12") selects that task as soon as it has loaded into view.
  const pendingSelect = useRef<number | null>(null);
  const selectWhenLoaded = useCallback((id: number) => {
    pendingSelect.current = id;
  }, []);
  useEffect(() => {
    const id = pendingSelect.current;
    if (id == null || !byId.has(id)) return;
    pendingSelect.current = null;
    setSelectedId(id);
  }, [byId]);
  const typeById = useMemo(() => new Map(types.map((t) => [t.id, t])), [types]);

  const toggleType = useCallback((id: string) => {
    setEnabledTypes((s) => {
      const n = new Set(s);
      if (!n.delete(id)) n.add(id);
      return n;
    });
  }, []);

  // Replace one row in place (optimistic edit, then the server's version), or drop it from view.
  const replaceRow = useCallback((row: EditTask) => setItems((xs) => xs.map((x) => (x.id === row.id ? row : x))), []);
  const dropRow = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);

  const save = useCallback(
    async (id: number, patch: TaskPatch) => {
      try {
        const row = await patchTask(id, patch);
        if (row.status !== status) dropRow(id);
        else replaceRow(row);
        if (patch.status) refreshStats();
        return row;
      } catch (e) {
        setError(`Save failed: ${e instanceof Error ? e.message : e}`);
        return null;
      }
    },
    [status, dropRow, replaceRow, refreshStats],
  );

  const move = useCallback(
    (id: number, lat: number, lon: number) => {
      setItems((xs) => xs.map((x) => (x.id === id ? { ...x, lat, lon } : x))); // optimistic
      void save(id, { lat, lon });
    },
    [save],
  );
  const resetPosition = useCallback((id: number) => void save(id, { resetPosition: true }), [save]);

  // Totals for the tasks you can see (your own, or everyone's for an admin), per status and per type.
  const counts = useMemo(() => {
    const c = { pending: 0, done: 0, skipped: 0 };
    for (const s of summary) {
      c.pending += s.pending;
      c.done += s.done;
      c.skipped += s.skipped;
    }
    return c;
  }, [summary]);
  const typeCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of summary) m[s.type] = (m[s.type] ?? 0) + s.pending;
    return m;
  }, [summary]);

  return {
    open,
    setOpen,
    types,
    typeById,
    loading,
    error,
    enabledTypes,
    toggleType,
    status,
    setStatus,
    assigned,
    setAssigned,
    isAdmin,
    refreshStats,
    reload,
    linkNode,
    syncSaved,
    items,
    byId,
    selectedId,
    setSelectedId,
    selectWhenLoaded,
    setBounds,
    save,
    move,
    resetPosition,
    counts,
    typeCounts,
  };
}

export type EditTasksState = ReturnType<typeof useEditTasks>;
