"use client";

// Version history of the selected feature (iD's History pane): every
// saved version with who/when, and exactly which tags changed from the
// version before it.

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchElementHistory, type ElementVersion } from "../api";
import type { EditorStore } from "../useEditorStore";
import PanelShell from "./PanelShell";

type Diff = { added: string[]; changed: string[]; removed: string[] };

function diffTags(prev: Record<string, string> | null, next: Record<string, string>): Diff {
  const before = prev ?? {};
  return {
    added: Object.keys(next).filter((k) => !(k in before)),
    changed: Object.keys(next).filter((k) => k in before && before[k] !== next[k]),
    removed: Object.keys(before).filter((k) => !(k in next)),
  };
}

function VersionList({ type, id }: { type: "node" | "way" | "relation"; id: number }) {
  const [state, setState] = useState<{ versions: ElementVersion[] | null; error: string | null }>({ versions: null, error: null });

  useEffect(() => {
    let cancelled = false;
    fetchElementHistory(type, id)
      .then((versions) => !cancelled && setState({ versions, error: null }))
      .catch((e) => !cancelled && setState({ versions: null, error: e instanceof Error ? e.message : "Failed to load history" }));
    return () => {
      cancelled = true;
    };
  }, [type, id]);

  if (state.error) return <div className="text-[color:var(--text-danger)]">{state.error}</div>;
  if (!state.versions) return <div className="text-[color:var(--text-muted)]">Loading…</div>;

  const newestFirst = [...state.versions].reverse();
  return (
    <div className="flex flex-col gap-2">
      {newestFirst.map((v, i) => {
        const prev = state.versions![state.versions!.length - 1 - i - 1] ?? null;
        const d = v.visible ? diffTags(prev?.tags ?? null, v.tags) : null;
        const nothing = d && d.added.length + d.changed.length + d.removed.length === 0;
        return (
          <div key={v.version} className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] p-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[color:var(--text-primary)]">
                Version {v.version}
                {!v.visible ? <span className="ml-1.5 rounded bg-[color:var(--text-danger)]/15 px-1 text-[10px] text-[color:var(--text-danger)]">deleted</span> : null}
              </span>
              <Link href={`/osm-editor/history?changeset=${v.changeset}`} className="text-[10px] text-[color:var(--orange-400)] underline">
                changeset #{v.changeset}
              </Link>
            </div>
            <div className="text-[10px] text-[color:var(--text-muted)]">{new Date(v.timestamp).toLocaleString()}</div>
            {d ? (
              <div className="mt-1 flex flex-col gap-0.5 text-[11px]">
                {d.added.map((k) => (
                  <span key={`a${k}`} className="text-[color:var(--text-success)]">
                    + {k} = {v.tags[k]}
                  </span>
                ))}
                {d.changed.map((k) => (
                  <span key={`c${k}`} className="text-[color:var(--text-warning)]">
                    ~ {k}: {prev?.tags[k]} → {v.tags[k]}
                  </span>
                ))}
                {d.removed.map((k) => (
                  <span key={`r${k}`} className="text-[color:var(--text-danger)]">
                    − {k}
                  </span>
                ))}
                {nothing ? <span className="text-[color:var(--text-muted)]">{prev ? "Geometry or members changed — tags the same." : "Created."}</span> : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function HistoryPanel({ store, onClose }: { store: EditorStore; onClose: () => void }) {
  const sel = store.selection.length === 1 ? store.selection[0] : null;
  return (
    <PanelShell title={store.t("panel.history")} onClose={onClose}>
      {!sel ? (
        <div className="text-[color:var(--text-muted)]">Select one feature to see its saved versions.</div>
      ) : sel.id < 0 ? (
        <div className="text-[color:var(--text-muted)]">This feature hasn&apos;t been saved yet, so it has no history.</div>
      ) : (
        <VersionList key={`${sel.type}${sel.id}`} type={sel.type} id={sel.id} />
      )}
    </PanelShell>
  );
}
