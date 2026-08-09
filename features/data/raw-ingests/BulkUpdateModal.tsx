"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";

import { bulkUpdateStatus } from "./api";
import type { IngestStatus } from "./types";

const STATUSES: IngestStatus[] = [
  "PENDING",
  "QUEUED",
  "CLASSIFYING",
  "PARSING",
  "ENRICHING",
  "GEO_RESOLVING",
  "CONFLATING",
  "SCORING",
  "DONE",
  "FAILED",
  "DUPLICATE",
  "SKIPPED",
];

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] text-white/85 outline-none transition placeholder:text-white/30 hover:bg-white/[0.06] focus:border-[color:var(--orange-400)]/40";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onApplied: () => void;
};

export default function BulkUpdateModal({ isOpen, onClose, onApplied }: Props) {
  const [idsText, setIdsText] = useState("");
  const [status, setStatus] = useState<IngestStatus>("SKIPPED");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIdsText("");
      setStatus("SKIPPED");
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleApply() {
    const ids = idsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) {
      setError("Enter at least one ingest ID.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await bulkUpdateStatus(ids, status);
      onApplied();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Bulk update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm overflow-hidden rounded-xl border border-white/10 bg-[color:var(--surface-2)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <span className="font-display text-[14px] font-semibold text-white/90">
            Bulk update status
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/50 transition hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 py-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-white/40">
              Ingest IDs (one per line) *
            </label>
            <textarea
              value={idsText}
              onChange={(e) => setIdsText(e.target.value)}
              placeholder={"a4e2...91f0\nb7c1...33a2"}
              rows={4}
              className={`${inputClass} font-mono`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-white/40">
              New status *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as IngestStatus)}
              className={inputClass}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <div className="rounded-md border border-[color:var(--text-danger)]/30 bg-[color:var(--text-danger)]/10 px-3 py-2 text-[11.5px] text-[color:var(--text-danger)]">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px] text-white/70 transition hover:bg-white/[0.06]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleApply()}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--orange-400)]/40 bg-[color:var(--orange-500)]/15 px-4 py-1.5 text-[12px] font-medium text-[color:var(--orange-400)] transition hover:bg-[color:var(--orange-500)]/25 disabled:pointer-events-none disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
