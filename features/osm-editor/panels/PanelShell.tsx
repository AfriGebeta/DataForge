"use client";

import { X } from "lucide-react";

// Shared frame for the floating right-hand panels (Background, Map data,
// Measurement, History). Same look as the Issues panel.
export default function PanelShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="absolute right-3 top-3 z-[1000] flex max-h-[calc(100%-24px)] w-80 max-w-[calc(100%-24px)] flex-col rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)]/95 text-[12px] shadow-xl backdrop-blur">
      <div className="flex items-center justify-between border-b border-[color:var(--border)] px-3 py-2">
        <span className="font-semibold text-[color:var(--text-primary)]">{title}</span>
        <button type="button" onClick={onClose} aria-label={`Close ${title}`} className="rounded-md p-1 text-[color:var(--text-muted)] transition hover:bg-[color:var(--surface-3)]">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">{children}</div>
    </div>
  );
}
