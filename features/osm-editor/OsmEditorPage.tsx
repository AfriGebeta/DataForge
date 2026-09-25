"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import type L from "leaflet";
import { Download, MapPin, Minus, Pin, Plus, Redo2, Route, Square, Trash2, Undo2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { closeChangeset, createChangeset, downloadTextFile, fetchChangesetOsmChangeXml, fetchMapData, fetchMapOsmXml, importOsmFile } from "./api";
import EditMenu from "./EditMenu";
import { nodeRole, wayRole } from "./lib/geometryRoles";
import type { Entity } from "./lib/graph";
import PresetPicker from "./PresetPicker";
import RelationMembership from "./RelationMembership";
import SaveReviewModal from "./SaveReviewModal";
import ShortcutsPanel from "./ShortcutsPanel";
import { useEditorStore, type SelectionEntry } from "./useEditorStore";
import type { BoundingBox, OsmTags } from "./types";

const OsmEditorMap = dynamic(() => import("./OsmEditorMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[color:var(--surface-1)] text-[12px] text-[color:var(--text-muted)]">
      Loading map…
    </div>
  ),
});

const primaryButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-[color:var(--orange-400)]/30 bg-[color:var(--orange-500)]/12 px-3 py-1.5 text-[12px] font-medium text-[color:var(--orange-400)] transition hover:bg-[color:var(--orange-500)]/20 disabled:opacity-40";
const secondaryButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1.5 text-[12px] font-medium text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-3)] disabled:opacity-40";
const activeToolButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#38bdf8]/40 bg-[#38bdf8]/15 px-3 py-1.5 text-[12px] font-medium text-[#38bdf8] transition hover:bg-[#38bdf8]/25";
const fieldInputClass =
  "w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-2.5 py-1.5 text-[12px] text-[color:var(--text-primary)] outline-none focus:border-[color:var(--orange-400)]/50";

type TagRow = { key: string; value: string };

function tagsToRows(tags: OsmTags): TagRow[] {
  return Object.entries(tags).map(([key, value]) => ({ key, value }));
}

function rowsToTags(rows: TagRow[]): OsmTags {
  const out: OsmTags = {};
  for (const row of rows) {
    const key = row.key.trim();
    if (key) out[key] = row.value;
  }
  return out;
}

function TagsEditor({ rows, onChange }: { rows: TagRow[]; onChange: (rows: TagRow[]) => void }) {
  function setRow(i: number, patch: Partial<TagRow>) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function removeRow(i: number) {
    onChange(rows.filter((_, idx) => idx !== i));
  }
  function addRow() {
    onChange([...rows, { key: "", value: "" }]);
  }

  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input value={row.key} onChange={(e) => setRow(i, { key: e.target.value })} placeholder="key" className={cn(fieldInputClass, "w-1/2")} />
          <input
            value={row.value}
            onChange={(e) => setRow(i, { value: e.target.value })}
            placeholder="value"
            className={cn(fieldInputClass, "w-1/2")}
          />
          <button
            type="button"
            onClick={() => removeRow(i)}
            className="shrink-0 rounded-md p-1.5 text-[color:var(--text-muted)] transition hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text-danger)]"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="inline-flex w-fit items-center gap-1 rounded-md border border-dashed border-[color:var(--border)] px-2 py-1 text-[11px] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-3)]"
      >
        <Plus className="h-3 w-3" />
        Add tag
      </button>
    </div>
  );
}

export default function OsmEditorPage() {
  const store = useEditorStore();

  const [changesetFormOpen, setChangesetFormOpen] = useState(false);
  const [changesetComment, setChangesetComment] = useState("");
  const [changesetBusy, setChangesetBusy] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const [bbox, setBbox] = useState<BoundingBox | null>(null);
  const [loadedAreaBounds, setLoadedAreaBounds] = useState<L.LatLngBoundsExpression | null>(null);
  const boundsGetterRef = useRef<(() => L.LatLngBounds) | null>(null);
  const registerBoundsGetter = useCallback((getter: () => L.LatLngBounds) => {
    boundsGetterRef.current = getter;
  }, []);

  const [showSaveReview, setShowSaveReview] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedEntity = (() => {
    if (store.selection.length !== 1) return null;
    const entry = store.selection[0];
    return { entry, entity: store.graph.get(entry.type, entry.id) };
  })();

  const selectedGeometryRole = (() => {
    if (!selectedEntity?.entity) return null;
    const { entity } = selectedEntity;
    if (entity.type === "node") return nodeRole(store.graph, entity);
    if (entity.type === "way") return wayRole(entity);
    return null; // relations have no point/vertex/line/area role — no preset picker for them
  })();

  // Multi-select (§C8): every selected entity that still resolves,
  // plus the "shared-tag view" — only tags whose key AND value are
  // identical across every selected entity are shown/editable as one
  // row; anything present on just some, or differing, is left out
  // rather than shown in a distinguishable "mixed" state (scope trim).
  const selectedEntities = store.selection
    .map((entry) => ({ entry, entity: store.graph.get(entry.type, entry.id) }))
    .filter((x): x is { entry: SelectionEntry; entity: Entity } => !!x.entity);

  function sharedTags(): OsmTags {
    if (selectedEntities.length === 0) return {};
    const [first, ...rest] = selectedEntities;
    const shared: OsmTags = {};
    for (const [k, v] of Object.entries(first.entity.tags)) {
      if (rest.every(({ entity }) => entity.tags[k] === v)) shared[k] = v;
    }
    return shared;
  }

  function updateSharedTags(newRows: TagRow[]) {
    const oldKeys = Object.keys(sharedTags());
    const newKeys = new Set(newRows.map((r) => r.key.trim()).filter(Boolean));
    const newTagsMap = rowsToTags(newRows);
    for (const { entry, entity } of selectedEntities) {
      const tags = { ...entity.tags };
      for (const k of oldKeys) if (!newKeys.has(k)) delete tags[k];
      for (const [k, v] of Object.entries(newTagsMap)) tags[k] = v;
      store.changeTags(entry.type, entry.id, tags);
    }
  }

  async function loadCurrentView() {
    const bounds = boundsGetterRef.current?.();
    if (!bounds) return;
    const box: BoundingBox = { minLat: bounds.getSouth(), minLon: bounds.getWest(), maxLat: bounds.getNorth(), maxLon: bounds.getEast() };
    setBbox(box);
    setLoadedAreaBounds(bounds);
    setLoading(true);
    setError(null);
    setHasLoadedOnce(true);
    try {
      store.loadMapData(await fetchMapData(box));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load map data.");
    } finally {
      setLoading(false);
    }
  }

  async function startEditingSession(e: React.FormEvent) {
    e.preventDefault();
    setChangesetBusy(true);
    setError(null);
    try {
      const created = await createChangeset({ comment: changesetComment.trim() || "Edited via Gebeta Forge OSM editor" });
      store.setChangeset(created);
      setChangesetFormOpen(false);
      setChangesetComment("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to open a changeset.");
    } finally {
      setChangesetBusy(false);
    }
  }

  async function finishEditingSession() {
    if (!store.changeset) return;
    setChangesetBusy(true);
    try {
      await closeChangeset(store.changeset.id);
      store.endSession();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to close the changeset.");
    } finally {
      setChangesetBusy(false);
    }
  }

  async function handleRestoreSnapshot() {
    if (!store.recoverableSnapshot) return;
    try {
      await store.restoreSnapshot(store.recoverableSnapshot);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to restore the recovered session.");
      store.dismissRecovery();
    }
  }

  function updateSelectedTags(rows: TagRow[]) {
    if (!selectedEntity?.entity) return;
    store.changeTags(selectedEntity.entry.type, selectedEntity.entry.id, rowsToTags(rows));
  }

  function deleteSelected() {
    store.deleteSelection();
  }

  async function exportMap() {
    if (!bbox) return;
    try {
      downloadTextFile("map.osm", await fetchMapOsmXml(bbox));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to export .osm file.");
    }
  }

  async function exportChangeset() {
    if (!store.changeset) return;
    try {
      downloadTextFile(`changeset-${store.changeset.id}.osc`, await fetchChangesetOsmChangeXml(store.changeset.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to export changeset.");
    }
  }

  function triggerImport() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !store.changeset) return;
    setError(null);
    try {
      const text = await file.text();
      await importOsmFile(store.changeset.id, text);
      if (bbox) store.loadMapData(await fetchMapData(bbox));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to import .osm file.");
    }
  }

  return (
    <div id="v-osm-editor-map" className="flex h-full flex-col">
      <div className="relative z-[1000] flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[color:var(--border)] bg-[color:var(--surface-1)] px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {!store.changeset ? (
            changesetFormOpen ? (
              <form onSubmit={(e) => void startEditingSession(e)} className="flex items-center gap-1.5">
                <input
                  autoFocus
                  value={changesetComment}
                  onChange={(e) => setChangesetComment(e.target.value)}
                  placeholder="Changeset comment (optional)"
                  className={cn(fieldInputClass, "w-64")}
                />
                <button type="submit" disabled={changesetBusy} className={primaryButtonClass}>
                  {changesetBusy ? "Opening…" : "Open changeset"}
                </button>
                <button type="button" onClick={() => setChangesetFormOpen(false)} className={secondaryButtonClass}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <button type="button" onClick={() => setChangesetFormOpen(true)} className={primaryButtonClass}>
                <Pin className="h-3.5 w-3.5" />
                Start editing session
              </button>
            )
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-[color:var(--orange-400)]/30 bg-[color:var(--orange-500)]/10 px-3 py-1.5 text-[12px] font-medium text-[color:var(--orange-400)]">
              Changeset #{store.changeset.id} · {store.changeset.numChanges} change{store.changeset.numChanges === 1 ? "" : "s"}
              {store.hasUnsavedChanges ? <span className="text-[color:var(--text-warning)]"> · unsaved edits</span> : null}
              <button
                type="button"
                onClick={() => void finishEditingSession()}
                disabled={changesetBusy}
                className="ml-1 rounded-md border border-[color:var(--orange-400)]/30 px-2 py-0.5 text-[11px] hover:bg-[color:var(--orange-500)]/20"
              >
                {changesetBusy ? "Closing…" : "Finish"}
              </button>
            </div>
          )}

          <button type="button" onClick={() => void loadCurrentView()} className={secondaryButtonClass}>
            <MapPin className="h-3.5 w-3.5" />
            Load / refresh view
          </button>

          <button
            type="button"
            onClick={() => store.setMode(store.mode === "drawPoint" ? "browse" : "drawPoint")}
            disabled={!store.changeset}
            className={store.mode === "drawPoint" ? activeToolButtonClass : secondaryButtonClass}
          >
            <MapPin className="h-3.5 w-3.5" />
            {store.mode === "drawPoint" ? "Click map to place…" : "Add point"}
          </button>
          <button
            type="button"
            onClick={() => store.setMode(store.mode === "drawLine" ? "browse" : "drawLine")}
            disabled={!store.changeset}
            className={store.mode === "drawLine" ? activeToolButtonClass : secondaryButtonClass}
          >
            <Route className="h-3.5 w-3.5" />
            {store.mode === "drawLine" ? "Click to add points, Enter to finish…" : "Add line"}
          </button>
          <button
            type="button"
            onClick={() => store.setMode(store.mode === "drawArea" ? "browse" : "drawArea")}
            disabled={!store.changeset}
            className={store.mode === "drawArea" ? activeToolButtonClass : secondaryButtonClass}
            title="Click points, then close the loop on the start point to finish"
          >
            <Square className="h-3.5 w-3.5" />
            {store.mode === "drawArea" ? "Click to add points, close the loop…" : "Add area"}
          </button>

          <div className="mx-1 h-5 w-px bg-[color:var(--border)]" />
          <button type="button" onClick={store.undo} disabled={!store.canUndo} className={secondaryButtonClass} title="Undo (Ctrl+Z)">
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={store.redo} disabled={!store.canRedo} className={secondaryButtonClass} title="Redo (Ctrl+Shift+Z)">
            <Redo2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowSaveReview(true)}
            disabled={!store.changeset || !store.hasUnsavedChanges || store.saving}
            className={primaryButtonClass}
          >
            {store.saving ? "Saving…" : "Save"}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => store.setWireframe(!store.wireframe)}
            className={store.wireframe ? activeToolButtonClass : secondaryButtonClass}
            title="Wireframe: show every feature as a plain line/point, no area fills"
          >
            Wireframe
          </button>
          <button
            type="button"
            onClick={() => store.setHighlightEdits(!store.highlightEdits)}
            className={store.highlightEdits ? activeToolButtonClass : secondaryButtonClass}
            title="Highlight features added/retagged/moved since the last save"
          >
            Highlight edits
          </button>
          <button type="button" onClick={() => setShowShortcuts(true)} className={secondaryButtonClass} title="Keyboard shortcuts">
            ?
          </button>
          <button type="button" onClick={() => void exportMap()} disabled={!bbox} className={secondaryButtonClass}>
            <Download className="h-3.5 w-3.5" />
            Export .osm
          </button>
          <button type="button" onClick={() => void exportChangeset()} disabled={!store.changeset} className={secondaryButtonClass}>
            <Download className="h-3.5 w-3.5" />
            Export changeset
          </button>
          <button type="button" onClick={triggerImport} disabled={!store.changeset} className={secondaryButtonClass}>
            <Upload className="h-3.5 w-3.5" />
            Import .osm
          </button>
          <input ref={fileInputRef} type="file" accept=".osm,.xml" hidden onChange={(e) => void handleImportFile(e)} />
        </div>
      </div>

      {store.recoverableSnapshot ? (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[color:var(--border)] bg-[color:var(--bg-warning)] px-4 py-2 text-[12px] text-[color:var(--text-warning)]">
          <span>
            Recovered unsaved edits from changeset #{store.recoverableSnapshot.changesetId} (
            {new Date(store.recoverableSnapshot.savedAt).toLocaleTimeString()}).
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => void handleRestoreSnapshot()} className="font-medium underline">
              Restore
            </button>
            <button type="button" onClick={store.dismissRecovery} className="text-[color:var(--text-muted)] underline">
              Discard
            </button>
          </span>
        </div>
      ) : null}

      {error ? (
        <div className="shrink-0 border-b border-[color:var(--border)] bg-[color:var(--surface-1)] px-4 py-2 text-[12px] text-[color:var(--text-danger)]">
          {error}
        </div>
      ) : null}

      {store.belowMinZoom ? (
        <div className="shrink-0 border-b border-[color:var(--border)] bg-[color:var(--bg-warning)] px-4 py-2 text-[12px] text-[color:var(--text-warning)]">
          Zoom in to at least level {store.minEditZoom} to edit.
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1">
        <OsmEditorMap store={store} registerBoundsGetter={registerBoundsGetter} loadedAreaBounds={loadedAreaBounds} />

        {loading ? (
          <div className="pointer-events-none absolute right-3 top-3 z-[1000] rounded-md border border-[color:var(--border)] bg-[color:var(--surface-2)]/90 px-2.5 py-1 text-[11px] text-[color:var(--text-secondary)] backdrop-blur">
            Loading…
          </div>
        ) : null}

        {!loading && !error && hasLoadedOnce && store.graph.visibleNodes().length === 0 && store.graph.visibleWays().length === 0 ? (
          <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center">
            <div className="max-w-xs rounded-md border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-3 text-center text-[12px] text-[color:var(--text-muted)]">
              No map data in this view yet.
            </div>
          </div>
        ) : null}
        {!hasLoadedOnce ? (
          <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center">
            <div className="max-w-xs rounded-md border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-3 text-center text-[12px] text-[color:var(--text-muted)]">
              Pan/zoom to the area you want, then click &ldquo;Load / refresh view&rdquo;.
            </div>
          </div>
        ) : null}

        {selectedEntity?.entity ? (
          <div className="absolute bottom-3 left-3 z-[1000] w-80 max-w-[calc(100%-24px)] rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)]/95 p-3 text-[12px] shadow-xl backdrop-blur">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-[color:var(--text-primary)]">
                {selectedEntity.entry.type === "node" ? <MapPin className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
                {selectedEntity.entry.type} #{selectedEntity.entry.id}
                <span className="text-[10px] font-normal text-[color:var(--text-muted)]">v{selectedEntity.entity.version}</span>
              </span>
              <button
                type="button"
                onClick={store.clearSelection}
                className="rounded-md p-1 text-[color:var(--text-muted)] transition hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text-primary)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {selectedGeometryRole ? (
              <PresetPicker
                store={store}
                entryType={selectedEntity.entry.type}
                entryId={selectedEntity.entry.id}
                entity={selectedEntity.entity}
                role={selectedGeometryRole}
              />
            ) : null}
            <TagsEditor rows={tagsToRows(selectedEntity.entity.tags)} onChange={updateSelectedTags} />
            {selectedEntity.entry.type === "node" || selectedEntity.entry.type === "way" ? (
              <RelationMembership store={store} entryType={selectedEntity.entry.type} entryId={selectedEntity.entry.id} />
            ) : null}
            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={deleteSelected}
                disabled={!store.changeset}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--text-danger)]/30 bg-[color:var(--text-danger)]/10 px-3 py-1.5 text-[12px] font-medium text-[color:var(--text-danger)] transition hover:bg-[color:var(--text-danger)]/20 disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
            {!store.changeset ? (
              <div className="mt-2 text-[11px] text-[color:var(--text-muted)]">Start an editing session to edit or delete this element.</div>
            ) : null}
          </div>
        ) : selectedEntities.length > 1 ? (
          <div className="absolute bottom-3 left-3 z-[1000] w-80 max-w-[calc(100%-24px)] rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)]/95 p-3 text-[12px] shadow-xl backdrop-blur">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium text-[color:var(--text-primary)]">{selectedEntities.length} features selected</span>
              <button
                type="button"
                onClick={store.clearSelection}
                className="rounded-md p-1 text-[color:var(--text-muted)] transition hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text-primary)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mb-1 text-[10px] text-[color:var(--text-muted)]">Shared tags (identical across every selected feature):</div>
            <TagsEditor rows={tagsToRows(sharedTags())} onChange={updateSharedTags} />
            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={deleteSelected}
                disabled={!store.changeset}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--text-danger)]/30 bg-[color:var(--text-danger)]/10 px-3 py-1.5 text-[12px] font-medium text-[color:var(--text-danger)] transition hover:bg-[color:var(--text-danger)]/20 disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete all
              </button>
            </div>
          </div>
        ) : null}

        <EditMenu store={store} />
      </div>

      {showSaveReview ? <SaveReviewModal store={store} onClose={() => setShowSaveReview(false)} /> : null}
      {showShortcuts ? <ShortcutsPanel onClose={() => setShowShortcuts(false)} /> : null}
    </div>
  );
}
