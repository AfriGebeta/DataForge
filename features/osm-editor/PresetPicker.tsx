"use client";

// Preset picker + structured fields — map-editor-full-spec.md §C9:
// "the sidebar matches a preset by the entity's tags and geometry role,
// shows a small set of structured fields for the common ones, and a
// raw tag table is always available as a fallback." (The raw table is
// OsmEditorPage.tsx's existing TagsEditor, rendered alongside this.)

import { useState } from "react";
import { ChevronDown, Search, Tag as TagIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GeometryRole } from "./lib/geometryRoles";
import type { Entity, EntityType, OsmTags } from "./lib/graph";
import { matchPreset, searchPresets, type Preset } from "./lib/presets";
import FieldsEditor, { type TagPatch } from "./FieldsEditor";
import type { EditorStore } from "./useEditorStore";

export default function PresetPicker({
  store,
  entryType,
  entryId,
  entity,
  role,
}: {
  store: EditorStore;
  entryType: EntityType;
  entryId: number;
  entity: Entity;
  role: GeometryRole;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const currentPreset = matchPreset(entity.tags, role);
  const results = searchPresets(query, role);

  function applyPreset(preset: Preset) {
    store.changeTags(entryType, entryId, { ...entity.tags, ...preset.tags });
    setOpen(false);
    setQuery("");
  }

  function clearPreset() {
    if (!currentPreset) return;
    const tags: OsmTags = { ...entity.tags };
    for (const k of Object.keys(currentPreset.tags)) delete tags[k];
    store.changeTags(entryType, entryId, tags);
  }

  function patchTags(patch: TagPatch) {
    const tags = { ...entity.tags };
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || !v.trim()) delete tags[k];
      else tags[k] = v;
    }
    store.changeTags(entryType, entryId, tags);
  }

  return (
    <div className="mb-2">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-2.5 py-1.5 text-left text-[12px] text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-3)]"
        >
          {currentPreset ? (
            <currentPreset.icon className="h-3.5 w-3.5 shrink-0" style={{ color: currentPreset.color }} />
          ) : (
            <TagIcon className="h-3.5 w-3.5 shrink-0 text-[color:var(--text-muted)]" />
          )}
          <span className={cn("flex-1 truncate", !currentPreset && "text-[color:var(--text-muted)]")}>
            {currentPreset?.name ?? "Choose a preset…"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[color:var(--text-muted)]" />
        </button>
        {currentPreset ? (
          <button
            type="button"
            onClick={clearPreset}
            title="Clear preset"
            className="rounded-md p-1.5 text-[color:var(--text-muted)] transition hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text-danger)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="mt-1.5 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] p-1.5">
          <div className="mb-1.5 flex items-center gap-1.5 rounded border border-[color:var(--border)] bg-[color:var(--surface-2)] px-2 py-1">
            <Search className="h-3 w-3 text-[color:var(--text-muted)]" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search presets…"
              className="flex-1 bg-transparent text-[12px] text-[color:var(--text-primary)] outline-none"
            />
          </div>
          <div className="max-h-40 overflow-y-auto">
            {results.length === 0 ? (
              <div className="px-2 py-2 text-[11px] text-[color:var(--text-muted)]">No matching presets.</div>
            ) : (
              results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-3)]"
                >
                  <p.icon className="h-3.5 w-3.5 shrink-0" style={{ color: p.color }} />
                  {p.name}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}

      {currentPreset?.fields?.length ? <FieldsEditor fields={currentPreset.fields} tags={entity.tags} onPatch={patchTags} /> : null}
    </div>
  );
}
