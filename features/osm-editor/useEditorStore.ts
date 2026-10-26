"use client";

// The editor's central state: graph/history, mode state machine,
// selection, keyboard shortcuts, and the real save (osmChange upload +
// reconcile) pipeline. map-editor-full-spec.md §1.2/§C1/§C8/§C12.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as graphActions from "./lib/actions";
import { clearSnapshot, readSnapshot, snapshotToGraphs, writeSnapshot, type AutosaveSnapshot } from "./lib/autosave";
import { mapDataToGraph } from "./lib/convert";
import { diffGraphs, isDiffEmpty, type GraphDiff } from "./lib/diff";
import type { DrawPoint } from "./lib/drawing";
import { Graph, PlaceholderIds, type Entity, type EntityType, type OsmTags } from "./lib/graph";
import { History } from "./lib/history";
import { copyFeatures, extendWay, nodeIdsOfSelection, pasteFeatures, type Clipboard } from "./lib/operations";
import { diffToOsmChangeXml, parseDiffResult } from "./lib/osmChangeXml";
import { detectLocale, translate, type Locale, type MessageKey } from "./lib/i18n";
import { DEFAULT_IMAGERY, DEFAULT_PREFS, hasSavedPrefs, loadPrefs, savePrefs, type ImagerySettings } from "./lib/prefs";
import { applyUploadResult } from "./lib/reconcile";
import { fetchCapabilities, getChangeset, uploadOsmChange } from "./api";
import type { Bounds, LatLon } from "./lib/location";
import type { OsmChangeset, OsmMapData, OsmNote } from "./types";
import type L from "leaflet";

export type EditorMode = "browse" | "select" | "drawPoint" | "drawLine" | "drawArea" | "addNote";

export interface SelectionEntry {
  type: EntityType;
  id: number;
}

export const MIN_EDIT_ZOOM = 16;

// An in-flight interactive Move/Rotate: the preview graph is recomputed
// from the committed graph on every pointer move and only becomes a
// real history entry when the user clicks to confirm.
export interface TransformState {
  kind: "move" | "rotate";
  nodeIds: number[];
}

// "Continue line": the draw session is seeded with this existing end node
// and, on finish, extends this way instead of creating a new one.
export interface ContinueTarget {
  wayId: number;
  nodeId: number;
}

export interface FocusRequest {
  lat: number;
  lon: number;
  zoom?: number;
  // When set, fit the map to these bounds instead of a point/zoom.
  fit?: Bounds;
  // Animate (fly) vs. jump.
  animate?: boolean;
  n: number; // bumps on every request so repeating the same target still fires
}

// A highlighted rectangle on the map — a tile (z/x/y), a bbox, or a drawn
// box. Mirrors the "Set boundary" tool of the Gebeta iD fork: a visible
// work area you can fly to and (here) load data for.
export interface MapBoundary {
  bounds: Bounds;
  kind: "tile" | "bounds";
  label: string;
}

// A request for the page to load map data for a bbox (used by Go-to /
// boundary: "fly there and load it").
export interface LoadRequest {
  bounds: Bounds;
  n: number;
}

export interface SaveOutcome {
  diff: GraphDiff;
  skippedDeletes: { type: EntityType; id: number }[];
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
}

export function useEditorStore() {
  const [history, setHistory] = useState<History>(() => History.init(Graph.empty()));
  const [serverGraph, setServerGraph] = useState<Graph>(() => Graph.empty());
  const [mode, setModeState] = useState<EditorMode>("browse");
  const [selection, setSelection] = useState<SelectionEntry[]>([]);
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);
  const [hoveredKey, setHoveredState] = useState<string | null>(null);
  // Mirror of hoveredKey that updates synchronously. A right-click arrives in
  // the same tick as the mouseover that precedes it, before React has
  // re-rendered with the new hoveredKey, so event handlers read this ref.
  const hoverRef = useRef<string | null>(null);
  const setHoveredKey = useCallback((next: string | null | ((prev: string | null) => string | null)) => {
    const value = typeof next === "function" ? next(hoverRef.current) : next;
    hoverRef.current = value;
    setHoveredState(value);
  }, []);
  const [zoom, setZoom] = useState(14);
  const [changeset, setChangeset] = useState<OsmChangeset | null>(null);
  const [saving, setSaving] = useState(false);
  const [continueTarget, setContinueTarget] = useState<ContinueTarget | null>(null);
  const [preview, setPreview] = useState<Graph | null>(null);
  const [transform, setTransform] = useState<TransformState | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  // The issue the user last clicked in the Issues panel: a red ring at its
  // location, plus the offending segment when the issue is about one.
  const [issueHighlight, setIssueHighlight] = useState<IssueHighlight | null>(null);
  const clipboardRef = useRef<Clipboard | null>(null);
  // The live Leaflet map, published by OsmEditorMap, so keyboard shortcuts
  // (pan/zoom/fit) can drive it from outside the map component tree.
  const mapRef = useRef<L.Map | null>(null);
  const registerMap = useCallback((m: L.Map | null) => {
    mapRef.current = m;
  }, []);
  const [boundary, setBoundaryState] = useState<MapBoundary | null>(null);
  const [drawingBoundary, setDrawingBoundary] = useState(false);
  const [loadRequest, setLoadRequest] = useState<LoadRequest | null>(null);
  // "Copy tags to…": waiting for the user to click the feature to paste onto.
  const [copyTagsSource, setCopyTagsSource] = useState<SelectionEntry | null>(null);
  // Entities to select as soon as they appear in a loaded graph (set by
  // `#id=…` links and search results for elements that aren't loaded yet).
  const pendingSelectRef = useRef<SelectionEntry[]>([]);
  // Map notes: loaded with the map area, shown as pins, edited in a panel.
  const [notes, setNotes] = useState<OsmNote[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  // Where the user clicked in Add-note mode, before the note is saved.
  const [noteDraft, setNoteDraft] = useState<{ lat: number; lon: number } | null>(null);
  // Auto-trace: the box the user dragged, whether we're waiting for that drag,
  // and the traced lines awaiting accept/discard.
  const [traceBox, setTraceBox] = useState<Bounds | null>(null);
  const [tracePicking, setTracePicking] = useState(false);
  const [tracePreview, setTracePreview] = useState<LatLon[][] | null>(null);
  const [showMinimap, setShowMinimap] = useState(false);
  const [copyTagsDialogOpen, setCopyTagsDialogOpen] = useState(false);
  const [dataVisible, setDataVisible] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [flashMessage, setFlashMessage] = useState<{ text: string; n: number } | null>(null);
  const flashSeq = useRef(0);

  // Short toast, like iD's flash bar — feedback for shortcut-driven
  // toggles that otherwise change nothing you can point at.
  const flash = useCallback((text: string) => {
    flashSeq.current += 1;
    setFlashMessage({ text, n: flashSeq.current });
  }, []);
  useEffect(() => {
    if (!flashMessage) return;
    const t = window.setTimeout(() => setFlashMessage(null), 1800);
    return () => window.clearTimeout(t);
  }, [flashMessage]);

  const cursorRef = useRef<{ lat: number; lon: number } | null>(null);
  // OsmEditorPage (unlike OsmEditorMap) isn't ssr:false, so its initial
  // render happens server-side too, where localStorage doesn't exist —
  // seeding these from loadPrefs()/readSnapshot() in the useState
  // initializer would make the very first client render disagree with
  // the server-rendered HTML (a real hydration mismatch, not just a
  // lint nit). Starting from the SSR-safe default and correcting once
  // in a mount effect is the standard fix for "sync from an external
  // system the server can't see."
  const [wireframe, setWireframe] = useState(false);
  const [highlightEdits, setHighlightEdits] = useState(false);
  const [imagery, setImageryState] = useState<ImagerySettings>(DEFAULT_IMAGERY);
  const [hiddenFeatures, setHiddenFeatures] = useState<string[]>([]);
  // Whether the server can serve Google imagery (a key is configured).
  const [googleTiles, setGoogleTiles] = useState(false);
  const [autosave, setAutosave] = useState(DEFAULT_PREFS.autosave);
  const [snapping, setSnapping] = useState(DEFAULT_PREFS.snapping);
  const [showCoords, setShowCoords] = useState(DEFAULT_PREFS.showCoords);
  const [autoLoad, setAutoLoad] = useState(DEFAULT_PREFS.autoLoad);
  const [locale, setLocale] = useState<Locale>(DEFAULT_PREFS.locale);
  const [recoverableSnapshot, setRecoverableSnapshot] = useState<AutosaveSnapshot | null>(null);
  // Saved prefs are written back only after they have been read in, otherwise
  // the first render's defaults overwrite them before they are applied.
  const [prefsReady, setPrefsReady] = useState(false);

  // Deliberate one-time sync from an external system (localStorage) the
  // server can't see — the documented exception to "don't setState
  // synchronously in an effect" (react.dev/learn/you-might-not-need-an-effect).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const prefs = loadPrefs();
    setWireframe(prefs.wireframe);
    setHighlightEdits(prefs.highlightEdits);
    setImageryState(prefs.imagery);
    setHiddenFeatures(prefs.hiddenFeatures);
    setAutosave(prefs.autosave);
    setSnapping(prefs.snapping);
    setShowCoords(prefs.showCoords);
    setAutoLoad(prefs.autoLoad);
    // First ever visit: follow the browser language (Amharic if it asks for it).
    setLocale(hasSavedPrefs() ? prefs.locale : detectLocale(navigator.language));
    setRecoverableSnapshot(readSnapshot());
    setPrefsReady(true);
    fetchCapabilities()
      .then((c) => setGoogleTiles(!!c.tiles?.google))
      .catch(() => undefined); // capabilities are optional: no Google layers, nothing else changes
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const placeholderIds = useRef(new PlaceholderIds());
  // `committedGraph` is the real, undoable state — what gets diffed,
  // autosaved and uploaded. `graph` is what renders and what edit
  // operations read: identical except while a Move/Rotate preview is live.
  const committedGraph = history.current;
  const graph = preview ?? committedGraph;

  useEffect(() => {
    if (!prefsReady) return;
    savePrefs({ wireframe, highlightEdits, imagery, hiddenFeatures, autosave, snapping, showCoords, autoLoad, locale });
  }, [prefsReady, wireframe, highlightEdits, imagery, hiddenFeatures, autosave, snapping, showCoords, autoLoad, locale]);

  // Translate an interface string into the current locale.
  const t = useCallback((key: MessageKey, vars?: Record<string, string | number>) => translate(locale, key, vars), [locale]);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // Back to factory settings (Preferences panel). Doesn't touch edits.
  const resetPrefs = useCallback(() => {
    setWireframe(DEFAULT_PREFS.wireframe);
    setHighlightEdits(DEFAULT_PREFS.highlightEdits);
    setImageryState(DEFAULT_PREFS.imagery);
    setHiddenFeatures(DEFAULT_PREFS.hiddenFeatures);
    setAutosave(DEFAULT_PREFS.autosave);
    setSnapping(DEFAULT_PREFS.snapping);
    setShowCoords(DEFAULT_PREFS.showCoords);
    setAutoLoad(DEFAULT_PREFS.autoLoad);
    setLocale(DEFAULT_PREFS.locale);
  }, []);

  const setImagery = useCallback((patch: Partial<ImagerySettings>) => setImageryState((prev) => ({ ...prev, ...patch })), []);
  const toggleFeature = useCallback(
    (id: string) => setHiddenFeatures((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    [],
  );
  const showAllFeatures = useCallback(() => setHiddenFeatures([]), []);

  const allocateId = useCallback((type: EntityType) => placeholderIds.current.next(type), []);

  const commitGraph = useCallback((next: Graph) => {
    setHistory((h) => h.commit(next));
  }, []);

  // Registers an entity fetched from outside the currently-loaded bbox
  // (e.g. RelationMembership.tsx pulling in a relation to edit its
  // membership) as part of the diff *baseline*, not just the working
  // graph. Without this, diffGraphs sees the entity in the head graph
  // but missing from serverGraph and defensively treats it as a brand
  // new create — which on save duplicates it under a fresh id instead
  // of modifying the real one. No-ops if already known, so it never
  // clobbers an already-tracked baseline with a possibly-stale refetch.
  const registerServerEntity = useCallback((entity: Entity) => {
    setServerGraph((sg) => (sg.has(entity.type, entity.id) ? sg : sg.replace(entity)));
  }, []);

  const undo = useCallback(() => setHistory((h) => h.undo()), []);
  const redo = useCallback(() => setHistory((h) => h.redo()), []);

  const setMode = useCallback((next: EditorMode) => {
    setModeState(next);
    if (next !== "drawLine") setContinueTarget(null);
    if (next !== "addNote") setNoteDraft(null);
    if (next !== "select") {
      setSelection([]);
      setMenuAnchor(null);
    }
  }, []);

  const select = useCallback(
    (entry: SelectionEntry, additive: boolean, anchor?: { x: number; y: number }) => {
      // "Copy tags to…" is waiting for a target: this click is the target.
      if (copyTagsSource && !(copyTagsSource.type === entry.type && copyTagsSource.id === entry.id)) {
        const source = copyTagsSource;
        setCopyTagsSource(null);
        setHistory((h) => {
          const src = h.current.get(source.type, source.id);
          const tgt = h.current.get(entry.type, entry.id);
          if (!src || !tgt) return h;
          return h.commit(graphActions.changeTags(h.current, entry.type, entry.id, { ...tgt.tags, ...src.tags }));
        });
        setSelection([entry]);
        setModeState("select");
        flash(`Copied tags onto ${entry.type} #${entry.id}`);
        return;
      }
      setSelectedNoteId(null);
      setSelection((prev) => {
        if (!additive) return [entry];
        const exists = prev.some((s) => s.type === entry.type && s.id === entry.id);
        if (exists) return prev.filter((s) => !(s.type === entry.type && s.id === entry.id));
        return [...prev, entry];
      });
      setModeState("select");
      if (anchor) setMenuAnchor(anchor);
    },
    [copyTagsSource, flash],
  );

  const clearSelection = useCallback(() => {
    setSelection([]);
    setMenuAnchor(null);
    setModeState((m) => (m === "select" ? "browse" : m));
  }, []);

  // Notes helpers: replace/insert one note after an action, or select one
  // (which deselects any feature, like iD's note selection).
  const upsertNote = useCallback((note: OsmNote) => {
    setNotes((prev) => (prev.some((n) => n.id === note.id) ? prev.map((n) => (n.id === note.id ? note : n)) : [note, ...prev]));
  }, []);
  const removeNote = useCallback((id: number) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setSelectedNoteId((cur) => (cur === id ? null : cur));
  }, []);
  const selectNote = useCallback((id: number | null) => {
    setSelectedNoteId(id);
    setNoteDraft(null);
    if (id !== null) {
      setSelection([]);
      setMenuAnchor(null);
      setModeState((m) => (m === "select" || m === "addNote" ? "browse" : m));
    }
  }, []);

  const loadMapData = useCallback((data: OsmMapData) => {
    const g = mapDataToGraph(data);
    setHistory(History.init(g));
    setServerGraph(g);
    const pending = pendingSelectRef.current.filter((e) => g.has(e.type, e.id));
    pendingSelectRef.current = [];
    setSelection(pending);
    setModeState(pending.length > 0 ? "select" : "browse");
  }, []);

  // ── entity-mutating helpers — all route through a functional
  // setHistory update so they always operate on the latest graph
  // regardless of render timing, never a closed-over stale one. ───────

  const moveNode = useCallback((id: number, lat: number, lon: number) => {
    setHistory((h) => h.commit(graphActions.moveNode(h.current, id, lat, lon)));
  }, []);

  const changeTags = useCallback((type: EntityType, id: number, tags: OsmTags) => {
    setHistory((h) => h.commit(graphActions.changeTags(h.current, type, id, tags)));
  }, []);

  const deleteEntity = useCallback((type: EntityType, id: number) => {
    setHistory((h) => {
      const g = h.current;
      const next =
        type === "node" ? graphActions.deleteNode(g, id) : type === "way" ? graphActions.deleteWay(g, id) : graphActions.deleteRelation(g, id);
      return h.commit(next);
    });
  }, []);

  const deleteSelection = useCallback(() => {
    setHistory((h) => {
      let g = h.current;
      for (const entry of selection) {
        g =
          entry.type === "node"
            ? graphActions.deleteNode(g, entry.id)
            : entry.type === "way"
              ? graphActions.deleteWay(g, entry.id)
              : graphActions.deleteRelation(g, entry.id);
      }
      return h.commit(g);
    });
    setSelection([]);
    setMenuAnchor(null);
    setModeState("browse");
  }, [selection]);

  const createPoint = useCallback(
    (lat: number, lon: number, tags: OsmTags = {}): number => {
      const id = allocateId("node");
      setHistory((h) => h.commit(graphActions.createNode(h.current, id, lat, lon, tags)));
      return id;
    },
    [allocateId],
  );

  // Commits a finished Draw Line/Area session (spec §C2). Each point
  // either reuses an existing node it snapped onto (`existingNodeId`),
  // gets inserted into another way it snapped onto the interior of
  // (`insertIntoWay`), or becomes a brand-new node — all as one atomic
  // history commit. `close` re-appends the first point's id, closing
  // the way into an area (§C2.5).
  const commitDrawnLine = useCallback(
    (points: DrawPoint[], tags: OsmTags = {}, close = false): number => {
      const ids = points.map((p) => p.existingNodeId ?? allocateId("node"));
      const wayId = allocateId("way");
      setHistory((h) => {
        let g = h.current;
        points.forEach((p, i) => {
          if (p.existingNodeId === undefined) g = graphActions.createNode(g, ids[i], p.lat, p.lon, {});
          if (p.insertIntoWay) g = graphActions.insertVertexIntoWay(g, p.insertIntoWay.wayId, p.insertIntoWay.atIndex, ids[i]);
        });
        const nodeIds = close ? [...ids, ids[0]] : ids;
        g = graphActions.createWay(g, wayId, nodeIds, tags);
        return h.commit(g);
      });
      return wayId;
    },
    [allocateId],
  );

  // ── continue a line from its end ──────────────────────────────────

  const startContinue = useCallback((wayId: number, nodeId: number) => {
    setMenuAnchor(null);
    setSelection([]);
    setContinueTarget({ wayId, nodeId });
    setModeState("drawLine");
  }, []);

  // Commits a finished Continue session. points[0] is the seed (the
  // existing end node); everything after it is new geometry appended to
  // the way. Same snap semantics as commitDrawnLine.
  const commitContinuedLine = useCallback(
    (points: DrawPoint[]): number | null => {
      const target = continueTarget;
      setContinueTarget(null);
      if (!target || points.length < 2) return null;
      const rest = points.slice(1);
      const ids = rest.map((p) => p.existingNodeId ?? allocateId("node"));
      let g = committedGraph;
      rest.forEach((p, i) => {
        if (p.existingNodeId === undefined) g = graphActions.createNode(g, ids[i], p.lat, p.lon, {});
        if (p.insertIntoWay) g = graphActions.insertVertexIntoWay(g, p.insertIntoWay.wayId, p.insertIntoWay.atIndex, ids[i]);
      });
      const extended = extendWay(g, target.wayId, target.nodeId, ids);
      if (!extended) return null;
      setHistory((h) => h.commit(extended));
      return target.wayId;
    },
    [continueTarget, committedGraph, allocateId],
  );

  // ── interactive transforms (Move / Rotate) ───────────────────────

  const startTransform = useCallback(
    (kind: TransformState["kind"]) => {
      const nodeIds = nodeIdsOfSelection(committedGraph, selection);
      if (nodeIds.length === 0) return;
      setMenuAnchor(null);
      setPreview(null);
      setTransform({ kind, nodeIds });
    },
    [committedGraph, selection],
  );

  const finishTransform = useCallback(
    (apply: boolean) => {
      if (apply && preview) setHistory((h) => h.commit(preview));
      setPreview(null);
      setTransform(null);
    },
    [preview],
  );

  // ── copy / paste ─────────────────────────────────────────────────

  const copySelection = useCallback((): boolean => {
    const clip = copyFeatures(committedGraph, selection);
    clipboardRef.current = clip;
    return clip !== null;
  }, [committedGraph, selection]);

  const hasClipboard = useCallback(() => clipboardRef.current !== null, []);

  const pasteClipboard = useCallback(() => {
    const clip = clipboardRef.current;
    const at = cursorRef.current;
    if (!clip || !at) return;
    const res = pasteFeatures(committedGraph, clip, at.lat, at.lon, (t) => allocateId(t));
    setHistory((h) => h.commit(res.graph));
    if (res.created.length > 0) {
      setSelection(res.created);
      setModeState("select");
    }
  }, [committedGraph, allocateId]);

  const focusOn = useCallback((lat: number, lon: number, zoom?: number, animate = true) => {
    setFocusRequest((prev) => ({ lat, lon, zoom, animate, n: (prev?.n ?? 0) + 1 }));
  }, []);

  const fitBounds = useCallback((b: Bounds, animate = true) => {
    setFocusRequest((prev) => ({ lat: (b.minLat + b.maxLat) / 2, lon: (b.minLon + b.maxLon) / 2, fit: b, animate, n: (prev?.n ?? 0) + 1 }));
  }, []);

  const requestLoad = useCallback((bounds: Bounds) => {
    setLoadRequest((prev) => ({ bounds, n: (prev?.n ?? 0) + 1 }));
  }, []);

  const setBoundary = useCallback((b: MapBoundary | null) => setBoundaryState(b), []);



  // ── save: real osmChange upload against the diff since last save ───

  const save = useCallback(async (): Promise<SaveOutcome> => {
    if (!changeset) throw new Error("No open changeset.");
    const diff = diffGraphs(serverGraph, committedGraph);
    if (isDiffEmpty(diff)) return { diff, skippedDeletes: [] };

    setSaving(true);
    try {
      const xml = diffToOsmChangeXml(diff);
      const resultXml = await uploadOsmChange(changeset.id, xml);
      const results = parseDiffResult(resultXml);
      const { graph: reconciled, skippedDeletes } = applyUploadResult(committedGraph, diff, results);
      setHistory(History.init(reconciled));
      setServerGraph(reconciled);
      setSelection([]);
      setMenuAnchor(null);
      setModeState("browse");
      setChangeset((cs) => (cs ? { ...cs, numChanges: cs.numChanges + results.length } : cs));
      clearSnapshot(); // safely on the server now — the local crash-recovery copy is no longer needed
      if (skippedDeletes.length > 0) {
        // The server refused these deletes (still referenced, e.g. by a
        // relation or another way's node); they're restored locally, so say so.
        flash(`${skippedDeletes.length} delete(s) were not applied by the server and were restored: ${skippedDeletes.map((s) => `${s.type} #${s.id}`).join(", ")}`);
      }
      return { diff, skippedDeletes };
    } finally {
      setSaving(false);
    }
  }, [changeset, committedGraph, serverGraph, flash]);

  const endSession = useCallback(() => {
    setChangeset(null);
    setModeState("browse");
    setSelection([]);
    clearSnapshot();
  }, []);

  // Crash recovery (§1.10): offers back whatever the last autosave
  // caught, without the user having to act on it — restoring re-fetches
  // the changeset to confirm it's still open before touching any state.
  const restoreSnapshot = useCallback(async (snapshot: AutosaveSnapshot) => {
    const cs = await getChangeset(snapshot.changesetId);
    if (!cs.open) throw new Error("That editing session was already closed elsewhere — its unsaved edits can't be recovered.");
    const { serverGraph: sg, headGraph: hg } = snapshotToGraphs(snapshot);
    placeholderIds.current.seedFrom(hg.all());
    setServerGraph(sg);
    setHistory(History.init(hg));
    setChangeset(cs);
    setRecoverableSnapshot(null);
    clearSnapshot();
  }, []);

  const dismissRecovery = useCallback(() => {
    setRecoverableSnapshot(null);
    clearSnapshot();
  }, []);

  const pendingDiff = useMemo(() => diffGraphs(serverGraph, committedGraph), [serverGraph, committedGraph]);

  // Autosave: whenever there's an open changeset with real unsaved work,
  // snapshot both the diff baseline and the working graph (see
  // lib/autosave.ts's doc comment on why both, not just the merged view).
  useEffect(() => {
    if (!changeset || !autosave || isDiffEmpty(pendingDiff)) return;
    writeSnapshot(changeset.id, serverGraph, committedGraph);
  }, [changeset, serverGraph, committedGraph, pendingDiff, autosave]);
  const hasUnsavedChanges = useMemo(() => !isDiffEmpty(pendingDiff), [pendingDiff]);

  // ── keyboard shortcuts (spec §1.12): undo/redo, escape-to-deselect,
  // delete-selection. Draw-mode-specific keys (Enter/Escape/Backspace
  // while drawing) are owned by the draw tool component itself so they
  // can see the live in-progress point buffer this hook doesn't have. ─
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if (e.key === "Escape") {
        // Esc unwinds the most transient state first, like iD.
        if (copyTagsSource) {
          setCopyTagsSource(null);
          flash("Copy tags cancelled");
          return;
        }
        if (drawingBoundary) {
          setDrawingBoundary(false);
          return;
        }
        if (tracePicking) {
          setTracePicking(false);
          return;
        }
        if (mode === "select") clearSelection();
        return;
      }
      // Delete / Backspace are NOT handled here: iD maps Backspace to
      // Downgrade and ⌘⌫ / Delete to Delete, which lives with the other
      // operation shortcuts (selectionOps.ts).
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, undo, redo, clearSelection, copyTagsSource, drawingBoundary, tracePicking, flash]);

  return {
    graph,
    serverGraph,
    mode,
    setMode,
    selection,
    select,
    clearSelection,
    menuAnchor,
    setMenuAnchor,
    hoveredKey,
    hoverRef,
    setHoveredKey,
    zoom,
    setZoom,
    minEditZoom: MIN_EDIT_ZOOM,
    belowMinZoom: zoom < MIN_EDIT_ZOOM,
    changeset,
    setChangeset,
    endSession,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    undo,
    redo,
    commitGraph,
    committedGraph,
    continueTarget,
    startContinue,
    commitContinuedLine,
    preview,
    setPreview,
    transform,
    startTransform,
    finishTransform,
    copySelection,
    hasClipboard,
    pasteClipboard,
    cursorRef,
    focusRequest,
    issueHighlight,
    setIssueHighlight,
    focusOn,
    fitBounds,
    mapRef,
    registerMap,
    boundary,
    setBoundary,
    drawingBoundary,
    setDrawingBoundary,
    loadRequest,
    requestLoad,
    copyTagsSource,
    setCopyTagsSource,
    copyTagsDialogOpen,
    setCopyTagsDialogOpen,
    showMinimap,
    setShowMinimap,
    traceBox,
    setTraceBox,
    tracePicking,
    setTracePicking,
    tracePreview,
    setTracePreview,
    notes,
    setNotes,
    upsertNote,
    removeNote,
    selectNote,
    selectedNoteId,
    noteDraft,
    setNoteDraft,
    pendingSelectRef,
    dataVisible,
    setDataVisible,
    sidebarVisible,
    setSidebarVisible,
    flashMessage,
    flash,
    setSelection,
    registerServerEntity,
    allocateId,
    moveNode,
    changeTags,
    deleteEntity,
    deleteSelection,
    createPoint,
    commitDrawnLine,
    loadMapData,
    save,
    saving,
    pendingDiff,
    hasUnsavedChanges,
    wireframe,
    setWireframe,
    highlightEdits,
    setHighlightEdits,
    imagery,
    setImagery,
    googleTiles,
    autosave,
    setAutosave,
    snapping,
    setSnapping,
    showCoords,
    setShowCoords,
    autoLoad,
    setAutoLoad,
    locale,
    setLocale,
    t,
    resetPrefs,
    hiddenFeatures,
    toggleFeature,
    showAllFeatures,
    recoverableSnapshot,
    restoreSnapshot,
    dismissRecovery,
  };
}

export interface IssueHighlight {
  lat: number;
  lon: number;
  segment?: [[number, number], [number, number]];
}

export type EditorStore = ReturnType<typeof useEditorStore>;
