"use client";

// Save review — map-editor-full-spec.md §1.10: summarize the diff,
// surface validation issues, block on errors, show upload progress,
// and a real conflict dialog (not a silent failure) on a 412.

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { OsmConflictError } from "./api";
import { diffCounts } from "./lib/diff";
import { validateDiff } from "./lib/validation";
import type { EditorStore } from "./useEditorStore";

const primaryButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-[color:var(--orange-400)]/30 bg-[color:var(--orange-500)]/12 px-3 py-1.5 text-[12px] font-medium text-[color:var(--orange-400)] transition hover:bg-[color:var(--orange-500)]/20 disabled:opacity-40";
const secondaryButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1.5 text-[12px] font-medium text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-3)] disabled:opacity-40";

export default function SaveReviewModal({ store, onClose }: { store: EditorStore; onClose: () => void }) {
  const diff = store.pendingDiff;
  const counts = diffCounts(diff);
  const issues = useMemo(() => validateDiff(store.graph, diff, store.serverGraph), [store.graph, diff, store.serverGraph]);
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function confirm() {
    setSaving(true);
    setError(null);
    setConflict(null);
    try {
      await store.save();
      onClose();
    } catch (cause) {
      if (cause instanceof OsmConflictError) setConflict(cause.message);
      else setError(cause instanceof Error ? cause.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40 p-4">
      <div className="w-96 max-w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4 text-[12px] shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[color:var(--text-primary)]">Review changes</span>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-[color:var(--text-muted)] transition hover:bg-[color:var(--surface-3)]">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mb-3 flex gap-3">
          <span className="text-[color:var(--text-success)]">+{counts.created} created</span>
          <span className="text-[color:var(--text-warning)]">~{counts.modified} modified</span>
          <span className="text-[color:var(--text-danger)]">-{counts.deleted} deleted</span>
        </div>

        {issues.length > 0 ? (
          <div className="mb-3 max-h-40 overflow-y-auto rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] p-2">
            {[...errors, ...warnings].map((issue, i) => (
              <div
                key={i}
                className={cn(
                  "mb-1 flex items-start gap-1.5 last:mb-0",
                  issue.severity === "error" ? "text-[color:var(--text-danger)]" : "text-[color:var(--text-warning)]",
                )}
              >
                {issue.severity === "error" ? (
                  <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                )}
                <span>
                  {issue.message}{" "}
                  <span className="text-[color:var(--text-muted)]">
                    ({issue.entity.type} #{issue.entity.id})
                  </span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-3 text-[color:var(--text-muted)]">No issues found.</div>
        )}

        {conflict ? (
          <div className="mb-3 rounded-md bg-[color:var(--bg-danger)] p-2 text-[color:var(--text-danger)]">
            <strong>Save conflict:</strong> {conflict} Close this, reload the area (Load / refresh view), and reapply your edit.
          </div>
        ) : null}
        {error ? <div className="mb-3 text-[color:var(--text-danger)]">{error}</div> : null}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={secondaryButtonClass}>
            Cancel
          </button>
          <button type="button" onClick={() => void confirm()} disabled={saving || errors.length > 0} className={primaryButtonClass}>
            {saving ? "Uploading…" : errors.length > 0 ? "Fix errors to save" : "Confirm & upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
