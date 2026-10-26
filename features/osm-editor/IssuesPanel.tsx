"use client";

// Issues panel — the iD "Issues" pane: every validation finding for
// either the pending edit ("My edits") or everything currently loaded,
// errors first, each with click-to-locate and one-click fixes.

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Wrench, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { scopeFromDiff, validateGraph, type ValidationIssue } from "./lib/validation";
import type { EditorStore } from "./useEditorStore";

export type IssueScope = "mine" | "all";

export function useIssues(store: EditorStore, scope: IssueScope): ValidationIssue[] {
  const graph = useDeferredValue(store.committedGraph);
  const diff = useDeferredValue(store.pendingDiff);
  const base = store.serverGraph;
  return useMemo(() => validateGraph(graph, scope === "all" ? "all" : scopeFromDiff(diff), base), [graph, diff, scope, base]);
}

const tabClass = (active: boolean) =>
  cn(
    "flex-1 rounded-md px-2 py-1 text-[11px] font-medium transition",
    active
      ? "bg-[color:var(--orange-500)]/15 text-[color:var(--orange-400)]"
      : "text-[color:var(--text-muted)] hover:bg-[color:var(--surface-3)]",
  );

export default function IssuesPanel({
  store,
  issues,
  scope,
  onScope,
  onClose,
}: {
  store: EditorStore;
  issues: ValidationIssue[];
  scope: IssueScope;
  onScope: (s: IssueScope) => void;
  onClose: () => void;
}) {
  const [ignored, setIgnored] = useState<Set<string>>(new Set());
  const clearHighlight = store.setIssueHighlight;
  useEffect(() => () => clearHighlight(null), [clearHighlight]);
  const visible = issues.filter((i) => !ignored.has(i.id));
  const errors = visible.filter((i) => i.severity === "error");
  const warnings = visible.filter((i) => i.severity === "warning");

  function locate(issue: ValidationIssue) {
    const first = issue.entities[0] ?? issue.entity;
    store.select({ type: first.type, id: first.id }, false);
    if (issue.entities.length > 1) {
      store.setSelection(issue.entities.map((e) => ({ type: e.type, id: e.id })));
    }
    if (issue.location) {
      store.setIssueHighlight({ ...issue.location, segment: issue.segment });
      if (issue.segment) {
        const [[aLat, aLon], [bLat, bLon]] = issue.segment;
        store.fitBounds({ minLat: Math.min(aLat, bLat), maxLat: Math.max(aLat, bLat), minLon: Math.min(aLon, bLon), maxLon: Math.max(aLon, bLon) });
      } else {
        store.focusOn(issue.location.lat, issue.location.lon, Math.max(store.zoom, 18));
      }
    } else {
      store.setIssueHighlight(null);
    }
  }

  function applyFix(issue: ValidationIssue, fixIndex: number) {
    const fix = issue.fixes?.[fixIndex];
    if (!fix || !store.changeset) return;
    store.commitGraph(fix.apply(store.committedGraph, { allocateId: store.allocateId }));
  }

  function row(issue: ValidationIssue) {
    const isError = issue.severity === "error";
    return (
      <div key={issue.id} className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] p-2">
        <button type="button" onClick={() => locate(issue)} className="flex w-full items-start gap-1.5 text-left">
          {isError ? (
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--text-danger)]" />
          ) : (
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--text-warning)]" />
          )}
          <span className="min-w-0">
            <span className="block text-[12px] text-[color:var(--text-primary)]">{issue.message}</span>
            <span className="block text-[10px] text-[color:var(--text-muted)]">
              {issue.entities.map((e) => `${e.type} #${e.id}`).join(", ")}
            </span>
          </span>
        </button>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-5">
          {issue.fixes?.map((fix, i) => (
            <button
              key={fix.label}
              type="button"
              disabled={!store.changeset}
              onClick={() => applyFix(issue, i)}
              className="inline-flex items-center gap-1 rounded border border-[color:var(--orange-400)]/30 bg-[color:var(--orange-500)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--orange-400)] transition hover:bg-[color:var(--orange-500)]/20 disabled:opacity-40"
            >
              <Wrench className="h-3 w-3" />
              {fix.label}
            </button>
          ))}
          {!isError ? (
            <button
              type="button"
              onClick={() => setIgnored((prev) => new Set(prev).add(issue.id))}
              className="text-[10px] text-[color:var(--text-muted)] underline hover:text-[color:var(--text-primary)]"
            >
              Ignore
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute right-3 top-3 z-[1000] flex max-h-[calc(100%-24px)] w-80 max-w-[calc(100%-24px)] flex-col rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)]/95 text-[12px] shadow-xl backdrop-blur">
      <div className="flex items-center justify-between border-b border-[color:var(--border)] px-3 py-2">
        <span className="font-semibold text-[color:var(--text-primary)]">{store.t("panel.issues")}</span>
        <button type="button" onClick={onClose} className="rounded-md p-1 text-[color:var(--text-muted)] transition hover:bg-[color:var(--surface-3)]">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex gap-1 px-3 pt-2">
        <button type="button" className={tabClass(scope === "mine")} onClick={() => onScope("mine")}>
          My edits
        </button>
        <button type="button" className={tabClass(scope === "all")} onClick={() => onScope("all")}>
          Everything loaded
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-3">
        {visible.length === 0 ? (
          <div className="flex items-center gap-1.5 text-[color:var(--text-muted)]">
            <CheckCircle2 className="h-4 w-4 text-[color:var(--text-success)]" />
            {scope === "mine" ? "No issues with your edits." : "No issues found in the loaded area."}
          </div>
        ) : (
          <>
            {errors.length > 0 ? <div className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--text-danger)]">Errors ({errors.length})</div> : null}
            {errors.map(row)}
            {warnings.length > 0 ? <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--text-warning)]">Warnings ({warnings.length})</div> : null}
            {warnings.map(row)}
          </>
        )}
      </div>
    </div>
  );
}
