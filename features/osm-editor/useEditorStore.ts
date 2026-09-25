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
import { diffToOsmChangeXml, parseDiffResult } from "./lib/osmChangeXml";
import { loadPrefs, savePrefs } from "./lib/prefs";
import { applyUploadResult } from "./lib/reconcile";
import { getChangeset, uploadOsmChange } from "./api";
import type { OsmChangeset, OsmMapData } from "./types";

export type EditorMode = "browse" | "select" | "drawPoint" | "drawLine" | "drawArea";

export interface SelectionEntry {
  type: EntityType;
  id: number;
}

export const MIN_EDIT_ZOOM = 16;

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
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [zoom, setZoom] = useState(14);
  const [changeset, setChangeset] = useState<OsmChangeset | null>(null);
  const [saving, setSaving] = useState(false);
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
  const [recoverableSnapshot, setRecoverableSnapshot] = useState<AutosaveSnapshot | null>(null);

  // Deliberate one-time sync from an external system (localStorage) the
  // server can't see — the documented exception to "don't setState
  // synchronously in an effect" (react.dev/learn/you-might-not-need-an-effect).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const prefs = loadPrefs();
    setWireframe(prefs.wireframe);
    setHighlightEdits(prefs.highlightEdits);
    setRecoverableSnapshot(readSnapshot());
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const placeholderIds = useRef(new PlaceholderIds());
  const graph = history.current;

  useEffect(() => {
    savePrefs({ wireframe, highlightEdits });
  }, [wireframe, highlightEdits]);

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
    if (next !== "select") {
      setSelection([]);
      setMenuAnchor(null);
    }
  }, []);

  const select = useCallback((entry: SelectionEntry, additive: boolean, anchor?: { x: number; y: number }) => {
    setSelection((prev) => {
      if (!additive) return [entry];
      const exists = prev.some((s) => s.type === entry.type && s.id === entry.id);
      if (exists) return prev.filter((s) => !(s.type === entry.type && s.id === entry.id));
      return [...prev, entry];
    });
    setModeState("select");
    if (anchor) setMenuAnchor(anchor);
  }, []);

  const clearSelection = useCallback(() => {
    setSelection([]);
    setMenuAnchor(null);
    setModeState((m) => (m === "select" ? "browse" : m));
  }, []);

  const loadMapData = useCallback((data: OsmMapData) => {
    const g = mapDataToGraph(data);
    setHistory(History.init(g));
    setServerGraph(g);
    setSelection([]);
    setModeState("browse");
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

  // ── save: real osmChange upload against the diff since last save ───

  const save = useCallback(async (): Promise<SaveOutcome> => {
    if (!changeset) throw new Error("No open changeset.");
    const diff = diffGraphs(serverGraph, graph);
    if (isDiffEmpty(diff)) return { diff, skippedDeletes: [] };

    setSaving(true);
    try {
      const xml = diffToOsmChangeXml(diff);
      const resultXml = await uploadOsmChange(changeset.id, xml);
      const results = parseDiffResult(resultXml);
      const { graph: reconciled, skippedDeletes } = applyUploadResult(graph, diff, results);
      setHistory(History.init(reconciled));
      setServerGraph(reconciled);
      setSelection([]);
      setMenuAnchor(null);
      setModeState("browse");
      setChangeset((cs) => (cs ? { ...cs, numChanges: cs.numChanges + results.length } : cs));
      clearSnapshot(); // safely on the server now — the local crash-recovery copy is no longer needed
      return { diff, skippedDeletes };
    } finally {
      setSaving(false);
    }
  }, [changeset, graph, serverGraph]);

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

  const pendingDiff = useMemo(() => diffGraphs(serverGraph, graph), [serverGraph, graph]);

  // Autosave: whenever there's an open changeset with real unsaved work,
  // snapshot both the diff baseline and the working graph (see
  // lib/autosave.ts's doc comment on why both, not just the merged view).
  useEffect(() => {
    if (!changeset || isDiffEmpty(pendingDiff)) return;
    writeSnapshot(changeset.id, serverGraph, graph);
  }, [changeset, serverGraph, graph, pendingDiff]);
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
      if (e.key === "Escape" && mode === "select") {
        clearSelection();
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && mode === "select" && selection.length > 0) {
        e.preventDefault();
        deleteSelection();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, selection, undo, redo, clearSelection, deleteSelection]);

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
    recoverableSnapshot,
    restoreSnapshot,
    dismissRecovery,
  };
}

export type EditorStore = ReturnType<typeof useEditorStore>;
