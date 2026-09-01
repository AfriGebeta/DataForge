"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Layers, Pencil, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createAddressNode,
  fetchAddressBoundaries,
  fetchAddressLevels,
  fetchAddressNodes,
  updateAddressBoundary,
  upsertAddressLevel,
} from "./api";
import { ADDRESS_LEVEL_FALLBACK_COLOR, addressLevelName, addressNodeName } from "./types";
import type { AddressLevelDef, AddressNode } from "./types";
import type { EditTarget } from "./AddressMap";

// How many boundary polygons to fetch in parallel - the backend warns some
// of these (e.g. a subcity/borough import) run into the thousands of
// points, so fetching the whole filtered set (up to 2000 nodes, see
// LIST_LIMIT in ./api) at once would hammer both the browser and the
// backend at once. Raised from 6 alongside LIST_LIMIT once the set of
// boundary-bearing nodes grew past ~575 (import_dashen_voronoi.py's 445 +
// the original 130) - 6-wide made that many round trips visibly crawl.
// Postgres' own pool (SetMaxOpenConns) is 20, so this stays under that.
// Chunk size for POST /addresses/boundaries requests - kept well under any
// reasonable body/response cap even for District's 1194 nodes, rather than
// one request per node (the old N-individual-fetch pattern this replaced -
// see api.ts's fetchAddressBoundaries comment).
const BOUNDARY_BATCH_SIZE = 150;
const BOUNDARY_BATCH_CONCURRENCY = 4;

// Leaflet touches `window` at module load time, which crashes during
// Next's server render of this "use client" tree - same reason
// features/address/conflicts/ConflictsPage.tsx loads its map client-only.
const AddressMap = dynamic(() => import("./AddressMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[color:var(--surface-1)] text-[12px] text-[color:var(--text-muted)]">
      Loading map…
    </div>
  ),
});

// levelsById comes from GET /address-levels (see AddressNodesPage) -
// replaces what used to be static ADDRESS_LEVEL_LABELS/ADDRESS_LEVEL_COLORS
// lookups in this file.
function levelLabel(levelsById: Map<number, AddressLevelDef>, level: number | null): string {
  if (level == null) return "—";
  return addressLevelName(levelsById.get(level), level);
}

function levelColor(levelsById: Map<number, AddressLevelDef>, level: number | null): string {
  if (level == null) return ADDRESS_LEVEL_FALLBACK_COLOR;
  return levelsById.get(level)?.color ?? ADDRESS_LEVEL_FALLBACK_COLOR;
}

function useClickOutside<T extends HTMLElement>(active: boolean, onOutside: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!active) return;
    function handle(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onOutside();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [active, onOutside]);
  return ref;
}

const menuRowClass = (active: boolean) =>
  cn(
    "flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] transition",
    active
      ? "bg-[color:var(--surface-3)] font-medium text-[color:var(--text-primary)]"
      : "text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-3)]",
  );

const primaryButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-[color:var(--orange-400)]/30 bg-[color:var(--orange-500)]/12 px-3 py-1.5 text-[12px] font-medium text-[color:var(--orange-400)] transition hover:bg-[color:var(--orange-500)]/20 disabled:opacity-40";
const secondaryButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1.5 text-[12px] font-medium text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-3)] disabled:opacity-40";
const fieldLabelClass = "mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]";
const fieldInputClass =
  "w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-2.5 py-1.5 text-[12px] text-[color:var(--text-primary)] outline-none focus:border-[color:var(--orange-400)]/50";

// Add Node: draw -> name/place-in-hierarchy -> save. Edit boundary: pick an
// existing node's already-loaded geometry -> drag vertices -> save. Only
// one of these (or plain browsing) is active at a time.
type MapMode =
  | { kind: "browse" }
  | { kind: "drawing" }
  | { kind: "naming"; geometry: GeoJSON.Geometry }
  | { kind: "editing"; nodeId: string; geometry: GeoJSON.Geometry };

// Mirrors PlaceForge's own address-hierarchy chain-continuity rule
// (isContinuousChain in address-admin-level/api/v1/handler.go) - a parent is
// only meaningful/required for levels above Country.
function needsParent(level: number): boolean {
  return level > 0;
}

type AddNodeFormValues = { level: number; parentId?: string; name: string; code?: string };

function AddNodeForm({
  defaultLevel,
  levels,
  onCancel,
  onSubmit,
  submitting,
  error,
}: {
  defaultLevel: number | "all";
  levels: AddressLevelDef[];
  onCancel: () => void;
  onSubmit: (values: AddNodeFormValues) => void;
  submitting: boolean;
  error: string | null;
}) {
  const [level, setLevel] = useState<number | "">(defaultLevel === "all" ? "" : defaultLevel);
  const [parentId, setParentId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [parentOptions, setParentOptions] = useState<AddressNode[]>([]);
  const [parentLoading, setParentLoading] = useState(false);

  useEffect(() => {
    setParentId("");
    if (level === "" || !needsParent(level)) {
      setParentOptions([]);
      return;
    }
    let cancelled = false;
    setParentLoading(true);
    void (async () => {
      const data = await fetchAddressNodes({ level: level - 1 });
      if (!cancelled) {
        setParentOptions(data);
        setParentLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [level]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (level === "" || !name.trim() || (needsParent(level) && !parentId)) return;
    onSubmit({ level, parentId: parentId || undefined, name: name.trim(), code: code.trim() || undefined });
  }

  const canSubmit = level !== "" && name.trim().length > 0 && (!needsParent(level) || parentId.length > 0);

  return (
    <form
      onSubmit={handleSubmit}
      className="absolute bottom-3 left-3 z-[1000] w-80 max-w-[calc(100%-24px)] rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)]/95 p-3 text-[12px] shadow-xl backdrop-blur"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-medium text-[color:var(--text-primary)]">New address node</span>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md p-1 text-[color:var(--text-muted)] transition hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text-primary)]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <label className="mb-2 block">
        <span className={fieldLabelClass}>Level</span>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value === "" ? "" : Number(e.target.value))}
          className={fieldInputClass}
        >
          <option value="">Choose a level…</option>
          {levels.map((l) => (
            <option key={l.level} value={l.level}>
              {addressLevelName(l, l.level)}
            </option>
          ))}
        </select>
      </label>

      {level !== "" && needsParent(level) ? (
        <label className="mb-2 block">
          <span className={fieldLabelClass}>
            Parent ({addressLevelName(levels.find((l) => l.level === level - 1), level - 1)})
          </span>
          <select value={parentId} onChange={(e) => setParentId(e.target.value)} className={fieldInputClass}>
            <option value="">{parentLoading ? "Loading…" : "Choose a parent…"}</option>
            {parentOptions.map((n) => (
              <option key={n.id} value={n.id}>
                {addressNodeName(n)}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="mb-2 block">
        <span className={fieldLabelClass}>Name</span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="English name"
          className={fieldInputClass}
        />
      </label>

      <label className="mb-3 block">
        <span className={fieldLabelClass}>Code (optional)</span>
        <input value={code} onChange={(e) => setCode(e.target.value)} className={fieldInputClass} />
      </label>

      {error ? <div className="mb-2 text-[11px] text-[color:var(--text-danger)]">{error}</div> : null}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={secondaryButtonClass}>
          Cancel
        </button>
        <button type="submit" disabled={submitting || !canSubmit} className={primaryButtonClass}>
          {submitting ? "Saving…" : "Create node"}
        </button>
      </div>
    </form>
  );
}

export default function AddressNodesPage() {
  const searchParams = useSearchParams();
  // Deep-link from e.g. the Address -> Conflicts page's "Fix on Address
  // map" links (?select=<addressId>) - applied once the matching node
  // actually shows up in `nodes` (see the effect below), not eagerly,
  // since selecting an id the current level/search filter doesn't include
  // would just silently no-op.
  const deepLinkSelectId = searchParams.get("select");

  const [nodes, setNodes] = useState<AddressNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // GET /address-levels - display metadata for every defined level,
  // replacing what used to be a hardcoded ADDRESS_LEVEL_LABELS/
  // ADDRESS_LEVEL_COLORS pair in ./types. Refetched after the manage-levels
  // form saves so a rename/new level shows up immediately.
  const [levels, setLevels] = useState<AddressLevelDef[]>([]);
  const loadLevels = useCallback(async () => {
    try {
      setLevels(await fetchAddressLevels());
    } catch (cause) {
      console.warn("fetchAddressLevels failed:", cause);
    }
  }, []);
  useEffect(() => {
    void loadLevels();
  }, [loadLevels]);
  const levelsById = useMemo(() => new Map(levels.map((l) => [l.level, l])), [levels]);
  const levelColorsMap = useMemo(
    () => new Map(levels.filter((l) => l.color != null).map((l) => [l.level, l.color as string])),
    [levels],
  );

  const [levelFilter, setLevelFilter] = useState<number | "all">("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Inline "Add / edit a level" form, opened from the Level filter panel -
  // "new" targets a not-yet-defined level number; picking an existing one
  // prefills its current name/color so it can be renamed/recolored.
  const [managingLevels, setManagingLevels] = useState(false);
  const [levelFormTarget, setLevelFormTarget] = useState<number | "new">("new");
  const [levelFormNumber, setLevelFormNumber] = useState("");
  const [levelFormName, setLevelFormName] = useState("");
  const [levelFormColor, setLevelFormColor] = useState("#94a3b8");
  const [levelFormSaving, setLevelFormSaving] = useState(false);
  const [levelFormError, setLevelFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!managingLevels) return;
    if (levelFormTarget === "new") {
      setLevelFormNumber("");
      setLevelFormName("");
      setLevelFormColor("#94a3b8");
      return;
    }
    const def = levelsById.get(levelFormTarget);
    setLevelFormNumber(String(levelFormTarget));
    setLevelFormName(def ? addressLevelName(def, levelFormTarget) : "");
    setLevelFormColor(def?.color ?? "#94a3b8");
  }, [managingLevels, levelFormTarget, levelsById]);

  async function submitLevelForm(e: React.FormEvent) {
    e.preventDefault();
    const levelNum = levelFormTarget === "new" ? Number(levelFormNumber) : levelFormTarget;
    if (!Number.isInteger(levelNum) || levelNum < 0 || !levelFormName.trim()) return;
    setLevelFormSaving(true);
    setLevelFormError(null);
    try {
      await upsertAddressLevel(levelNum, { en: levelFormName.trim() }, levelFormColor || null);
      await loadLevels();
      setLevelFormTarget(levelNum);
    } catch (cause) {
      setLevelFormError(cause instanceof Error ? cause.message : "Failed to save level.");
    } finally {
      setLevelFormSaving(false);
    }
  }

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const appliedDeepLinkRef = useRef(false);
  // id -> geometry (or null once fetched-but-absent). Persists across
  // filter changes so revisiting a level/search doesn't refetch nodes
  // already loaded once.
  const [boundaries, setBoundaries] = useState<Map<string, GeoJSON.Geometry | null>>(new Map());
  const requestedBoundaryIds = useRef<Set<string>>(new Set());

  const [mapMode, setMapMode] = useState<MapMode>({ kind: "browse" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Written on every vertex drag while editing; read once when Save is
  // clicked. A ref (not state) since it can fire many times per second and
  // the live shape is already rendered by AddressMap's own imperative
  // Leaflet layer - no need to re-render this component on every nudge.
  const editDraftRef = useRef<GeoJSON.Geometry | null>(null);

  const [levelMenuOpen, setLevelMenuOpen] = useState(false);
  const [searchMenuOpen, setSearchMenuOpen] = useState(false);

  const levelMenuRef = useClickOutside<HTMLDivElement>(levelMenuOpen, () => setLevelMenuOpen(false));
  const searchMenuRef = useClickOutside<HTMLDivElement>(searchMenuOpen, () => setSearchMenuOpen(false));

  // Debounced so typing doesn't fire a request (and a map refit) per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAddressNodes({
        level: levelFilter === "all" ? undefined : levelFilter,
        search: search || undefined,
      });
      setNodes(data);
      // Decided outside the updater, not inside it - setState updaters must
      // be pure (React 18 Strict Mode double-invokes them in dev to check
      // this), and mutating appliedDeepLinkRef from inside one meant the
      // second, purity-check invocation saw the ref already flipped and
      // silently discarded the selection.
      const applyDeepLink = !appliedDeepLinkRef.current && !!deepLinkSelectId && data.some((n) => n.id === deepLinkSelectId);
      if (applyDeepLink) appliedDeepLinkRef.current = true;
      setSelectedId((current) => {
        if (applyDeepLink) return deepLinkSelectId;
        return current && data.some((n) => n.id === current) ? current : null;
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load addresses.");
    } finally {
      setLoading(false);
    }
  }, [levelFilter, search, deepLinkSelectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = nodes.find((n) => n.id === selectedId) ?? null;

  // Fetch every visible node's boundary polygon (not just the selected
  // one) so the map can render full admin-area shapes instead of dots -
  // per user request, filtering only happens via Level/Search, not by
  // whichever node happens to be selected. Batched (POST /addresses/
  // boundaries, BOUNDARY_BATCH_SIZE ids per call) rather than one request
  // per node - a level with 100+ polygons (e.g. Borough) used to fire that
  // many individual requests, and any that didn't come back in time
  // silently rendered as a dot with no visible error. Cached by id in
  // `boundaries` so switching filters back and forth doesn't refetch.
  useEffect(() => {
    const toFetch = nodes.filter((n) => n.hasBoundary && !requestedBoundaryIds.current.has(n.id));
    if (toFetch.length === 0) return;
    toFetch.forEach((n) => requestedBoundaryIds.current.add(n.id));

    const chunks: AddressNode[][] = [];
    for (let i = 0; i < toFetch.length; i += BOUNDARY_BATCH_SIZE) {
      chunks.push(toFetch.slice(i, i + BOUNDARY_BATCH_SIZE));
    }

    let cancelled = false;
    let cursor = 0;
    async function worker() {
      while (!cancelled) {
        const chunk = chunks[cursor++];
        if (!chunk) return;
        const found = await fetchAddressBoundaries(chunk.map((n) => n.id));
        if (cancelled) return;
        setBoundaries((prev) => {
          const next = new Map(prev);
          for (const node of chunk) {
            next.set(node.id, found.get(node.id) ?? null);
          }
          return next;
        });
      }
    }
    void Promise.all(Array.from({ length: BOUNDARY_BATCH_CONCURRENCY }, worker));

    return () => {
      cancelled = true;
    };
  }, [nodes]);

  const searchResults = useMemo(() => (search ? nodes.slice(0, 8) : []), [nodes, search]);
  const boundariesLoading = useMemo(
    () => nodes.some((n) => n.hasBoundary && !boundaries.has(n.id)),
    [nodes, boundaries],
  );

  function selectLevel(level: number | "all") {
    setLevelFilter(level);
    setLevelMenuOpen(false);
  }

  function selectNode(id: string) {
    setSelectedId(id);
    setSearchMenuOpen(false);
  }

  // Only browsing selects a node - a stray click on the map while drawing/
  // editing shouldn't silently swap out what the floating card is showing.
  function handleMapSelect(id: string) {
    if (mapMode.kind !== "browse") return;
    selectNode(id);
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");
  }

  function startDrawing() {
    setSelectedId(null);
    setLevelMenuOpen(false);
    setSearchMenuOpen(false);
    setSaveError(null);
    setMapMode({ kind: "drawing" });
  }

  // useCallback: passed to AddressMap's DrawTool as an effect dependency -
  // an unstable identity would tear down and re-enable the draw tool (and
  // abandon an in-progress unfinished polygon) on any unrelated re-render.
  const handleDrawFinished = useCallback((geometry: GeoJSON.Geometry) => {
    setSaveError(null);
    setMapMode({ kind: "naming", geometry });
  }, []);

  function cancelMode() {
    editDraftRef.current = null;
    setSaveError(null);
    setMapMode({ kind: "browse" });
  }

  async function submitNewNode(values: AddNodeFormValues) {
    if (mapMode.kind !== "naming") return;
    setSaving(true);
    setSaveError(null);
    try {
      const created = await createAddressNode({
        level: values.level,
        parentId: values.parentId,
        name: { en: values.name },
        code: values.code,
        boundary: mapMode.geometry,
      });
      setNodes((prev) => [...prev, created]);
      setBoundaries((prev) => {
        const next = new Map(prev);
        next.set(created.id, mapMode.geometry);
        return next;
      });
      requestedBoundaryIds.current.add(created.id);
      setSelectedId(created.id);
      setMapMode({ kind: "browse" });
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "Failed to create address node.");
    } finally {
      setSaving(false);
    }
  }

  function startEditing() {
    if (!selected) return;
    const geometry = boundaries.get(selected.id);
    if (!geometry) return;
    editDraftRef.current = geometry;
    setSaveError(null);
    setMapMode({ kind: "editing", nodeId: selected.id, geometry });
  }

  // useCallback for the same reason as handleDrawFinished - AddressMap
  // deliberately excludes this from its edit-layer effect's dependencies,
  // but keeping it stable is still good practice since nothing here needs
  // to react to per-render values.
  const handleEditChange = useCallback((geometry: GeoJSON.Geometry) => {
    editDraftRef.current = geometry;
  }, []);

  async function saveEditing() {
    if (mapMode.kind !== "editing") return;
    const geometry = editDraftRef.current ?? mapMode.geometry;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateAddressBoundary(mapMode.nodeId, geometry);
      setNodes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      setBoundaries((prev) => {
        const next = new Map(prev);
        next.set(updated.id, geometry);
        return next;
      });
      editDraftRef.current = null;
      setMapMode({ kind: "browse" });
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "Failed to update boundary.");
    } finally {
      setSaving(false);
    }
  }

  const currentLevelLabel = levelFilter === "all" ? "All levels" : levelLabel(levelsById, levelFilter);
  const editingTarget: EditTarget | null = mapMode.kind === "editing" ? mapMode : null;
  const previewGeometry = mapMode.kind === "naming" ? mapMode.geometry : null;

  return (
    <div id="v-address-nodes-map" className="flex h-full flex-col">
      <div className="relative z-[1000] flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[color:var(--border)] bg-[color:var(--surface-1)] px-4 py-2.5">
        {mapMode.kind === "drawing" ? (
          <>
            <span className="text-[12px] text-[color:var(--text-secondary)]">
              Click on the map to draw the new node&apos;s boundary. Click the first point again (or press Enter) to
              finish.
            </span>
            <button type="button" onClick={cancelMode} className={secondaryButtonClass}>
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          </>
        ) : (
          <>
        <div ref={levelMenuRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setLevelMenuOpen((v) => !v);
              setSearchMenuOpen(false);
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1.5 text-[12px] font-medium text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-3)]"
          >
            <Layers className="h-3.5 w-3.5 text-[color:var(--text-secondary)]" />
            {levelFilter !== "all" ? (
              <span className="h-2 w-2 rounded-full" style={{ background: levelColor(levelsById, levelFilter) }} />
            ) : null}
            {currentLevelLabel}
            <ChevronDown className="h-3.5 w-3.5 text-[color:var(--text-muted)]" />
          </button>

          {levelMenuOpen ? (
            <div className="absolute left-0 top-[calc(100%+6px)] z-10 w-64 overflow-hidden rounded-md border border-[color:var(--border)] bg-[color:var(--surface-2)] py-1 shadow-xl">
              <label className={cn(menuRowClass(levelFilter === "all"), "cursor-pointer")}>
                <input
                  type="radio"
                  name="level-filter"
                  checked={levelFilter === "all"}
                  onChange={() => selectLevel("all")}
                  className="h-3 w-3 accent-[color:var(--orange-400)]"
                />
                All levels
              </label>
              {levels.map((l) => (
                <label key={l.level} className={cn(menuRowClass(levelFilter === l.level), "cursor-pointer")}>
                  <input
                    type="radio"
                    name="level-filter"
                    checked={levelFilter === l.level}
                    onChange={() => selectLevel(l.level)}
                    className="h-3 w-3 accent-[color:var(--orange-400)]"
                  />
                  <span className="h-2 w-2 rounded-full" style={{ background: l.color ?? ADDRESS_LEVEL_FALLBACK_COLOR }} />
                  {addressLevelName(l, l.level)}
                </label>
              ))}

              <div className="mt-1 border-t border-[color:var(--border)] pt-1">
                <button
                  type="button"
                  onClick={() => setManagingLevels((v) => !v)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-3)]"
                >
                  <Pencil className="h-3 w-3" />
                  {managingLevels ? "Close" : "Add / edit a level…"}
                </button>
                {managingLevels ? (
                  <form onSubmit={(e) => void submitLevelForm(e)} className="flex flex-col gap-1.5 px-3 py-2">
                    <select
                      value={levelFormTarget}
                      onChange={(e) => setLevelFormTarget(e.target.value === "new" ? "new" : Number(e.target.value))}
                      className={fieldInputClass}
                    >
                      <option value="new">+ New level…</option>
                      {levels.map((l) => (
                        <option key={l.level} value={l.level}>
                          {addressLevelName(l, l.level)}
                        </option>
                      ))}
                    </select>
                    {levelFormTarget === "new" ? (
                      <input
                        type="number"
                        min={0}
                        placeholder="Level number"
                        value={levelFormNumber}
                        onChange={(e) => setLevelFormNumber(e.target.value)}
                        className={fieldInputClass}
                      />
                    ) : null}
                    <input
                      type="text"
                      placeholder="Name"
                      value={levelFormName}
                      onChange={(e) => setLevelFormName(e.target.value)}
                      className={fieldInputClass}
                    />
                    <input
                      type="color"
                      value={levelFormColor}
                      onChange={(e) => setLevelFormColor(e.target.value)}
                      className="h-7 w-full cursor-pointer rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)]"
                    />
                    {levelFormError ? (
                      <div className="text-[10px] text-[color:var(--text-danger)]">{levelFormError}</div>
                    ) : null}
                    <button
                      type="submit"
                      disabled={levelFormSaving || !levelFormName.trim()}
                      className={cn(primaryButtonClass, "w-full")}
                    >
                      {levelFormSaving ? "Saving…" : "Save level"}
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
        <button type="button" onClick={startDrawing} className={secondaryButtonClass}>
          <Plus className="h-3.5 w-3.5" />
          Add node
        </button>

        <div ref={searchMenuRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setSearchMenuOpen((v) => !v);
              setLevelMenuOpen(false);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-medium transition",
              search
                ? "border-[color:var(--orange-400)]/40 bg-[color:var(--orange-500)]/12 text-[color:var(--orange-400)]"
                : "border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--text-primary)] hover:bg-[color:var(--surface-3)]",
            )}
          >
            <Search className="h-3.5 w-3.5" />
            <span className="max-w-[140px] truncate">{search || "Search"}</span>
            {search ? (
              <X
                className="h-3.5 w-3.5"
                onClick={(e) => {
                  e.stopPropagation();
                  clearSearch();
                }}
              />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-[color:var(--text-muted)]" />
            )}
          </button>

          {searchMenuOpen ? (
            <div className="absolute right-0 top-[calc(100%+6px)] z-10 w-72 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-2)] p-2 shadow-xl">
              <input
                autoFocus
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name…"
                className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-2.5 py-1.5 text-[12px] text-[color:var(--text-primary)] outline-none focus:border-[color:var(--orange-400)]/50"
              />
              {search ? (
                <div className="mt-2 max-h-64 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="px-2 py-3 text-center text-[11px] text-[color:var(--text-muted)]">No matches.</div>
                  ) : (
                    searchResults.map((node) => (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => selectNode(node.id)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text-primary)]"
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: levelColor(levelsById, node.level) }} />
                        <span className="flex-1 truncate">{addressNodeName(node)}</span>
                        <span className="shrink-0 text-[10px] text-[color:var(--text-muted)]">{levelLabel(levelsById, node.level)}</span>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        </div>
          </>
        )}
      </div>

      {error ? (
        <div className="shrink-0 border-b border-[color:var(--border)] bg-[color:var(--surface-1)] px-4 py-2 text-[12px] text-[color:var(--text-danger)]">
          {error}
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1">
        <AddressMap
          nodes={nodes}
          selectedId={selectedId}
          boundaries={boundaries}
          onSelect={handleMapSelect}
          drawing={mapMode.kind === "drawing"}
          onDrawFinished={handleDrawFinished}
          previewGeometry={previewGeometry}
          editing={editingTarget}
          onEditChange={handleEditChange}
          levelColors={levelColorsMap}
        />

        {loading ? (
          <div className="pointer-events-none absolute right-3 top-3 z-[1000] rounded-md border border-[color:var(--border)] bg-[color:var(--surface-2)]/90 px-2.5 py-1 text-[11px] text-[color:var(--text-secondary)] backdrop-blur">
            Loading…
          </div>
        ) : boundariesLoading ? (
          <div className="pointer-events-none absolute right-3 top-3 z-[1000] rounded-md border border-[color:var(--border)] bg-[color:var(--surface-2)]/90 px-2.5 py-1 text-[11px] text-[color:var(--text-secondary)] backdrop-blur">
            Loading boundaries…
          </div>
        ) : null}

        {!loading && !error && nodes.length === 0 ? (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center">
            <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-3 text-[12px] text-[color:var(--text-muted)]">
              No address nodes match this filter.
            </div>
          </div>
        ) : null}

        {mapMode.kind === "naming" ? (
          <AddNodeForm
            defaultLevel={levelFilter}
            levels={levels}
            onCancel={cancelMode}
            onSubmit={submitNewNode}
            submitting={saving}
            error={saveError}
          />
        ) : mapMode.kind === "editing" ? (
          <div className="absolute bottom-3 left-3 z-[1000] w-72 max-w-[calc(100%-24px)] rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)]/95 p-3 text-[12px] shadow-xl backdrop-blur">
            <div className="mb-1 font-medium text-[color:var(--text-primary)]">Reshape boundary</div>
            <p className="mb-3 text-[11px] text-[color:var(--text-secondary)]">
              Drag the vertices on the map to reshape it, then save.
            </p>
            {saveError ? <div className="mb-2 text-[11px] text-[color:var(--text-danger)]">{saveError}</div> : null}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={cancelMode} className={secondaryButtonClass}>
                Cancel
              </button>
              <button type="button" onClick={() => void saveEditing()} disabled={saving} className={primaryButtonClass}>
                {saving ? "Saving…" : "Save boundary"}
              </button>
            </div>
          </div>
        ) : selected ? (
          <div className="absolute bottom-3 left-3 z-[1000] w-72 max-w-[calc(100%-24px)] rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)]/95 p-3 text-[12px] shadow-xl backdrop-blur">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: levelColor(levelsById, selected.level) }} />
                  <span className="truncate font-medium text-[color:var(--text-primary)]">{addressNodeName(selected)}</span>
                </div>
                <div className="mt-1 text-[11px] text-[color:var(--text-secondary)]">
                  {levelLabel(levelsById, selected.level)}
                  {selected.code ? ` · ${selected.code}` : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="shrink-0 rounded-md p-1 text-[color:var(--text-muted)] transition hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text-primary)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-[color:var(--text-secondary)]">
              <span>
                {(() => {
                  if (!selected.hasBoundary) return "No boundary recorded — shown as a point only.";
                  const geom = boundaries.get(selected.id);
                  if (geom === undefined) return "Loading boundary…";
                  return geom ? "Boundary polygon shown on the map." : "Boundary is recorded but couldn't be loaded.";
                })()}
              </span>
              {selected.hasBoundary && boundaries.get(selected.id) ? (
                <button
                  type="button"
                  onClick={startEditing}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[color:var(--border)] px-2 py-1 text-[11px] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text-primary)]"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
