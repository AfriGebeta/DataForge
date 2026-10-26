"use client";

import { useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { CUSTOM_IMAGERY_ID, GOOGLE_IMAGERY, IMAGERY, NO_IMAGERY_ID, validCustomTemplate } from "../lib/imagery";
import type { EditorStore } from "../useEditorStore";
import PanelShell from "./PanelShell";

const inputClass =
  "w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-2 py-1 text-[12px] text-[color:var(--text-primary)] outline-none focus:border-[color:var(--orange-400)]/50";
const nudgeBtn = "rounded border border-[color:var(--border)] bg-[color:var(--surface-1)] p-1 text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-3)]";

function Option({ active, title, subtitle, onClick }: { active: boolean; title: string; subtitle?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-2 rounded-md border px-2 py-1.5 text-left transition",
        active ? "border-[color:var(--orange-400)]/50 bg-[color:var(--orange-500)]/10" : "border-[color:var(--border)] bg-[color:var(--surface-1)] hover:bg-[color:var(--surface-3)]",
      )}
    >
      <span className={cn("mt-0.5 h-3 w-3 shrink-0 rounded-full border", active ? "border-[color:var(--orange-400)] bg-[color:var(--orange-400)]" : "border-[color:var(--border)]")} />
      <span className="min-w-0">
        <span className="block text-[12px] text-[color:var(--text-primary)]">{title}</span>
        {subtitle ? <span className="block text-[10px] text-[color:var(--text-muted)]">{subtitle}</span> : null}
      </span>
    </button>
  );
}

export default function BackgroundPanel({ store, onClose }: { store: EditorStore; onClose: () => void }) {
  const { imagery, setImagery } = store;
  const [draftUrl, setDraftUrl] = useState(imagery.customUrl);
  const urlOk = draftUrl === "" || validCustomTemplate(draftUrl);

  function nudge(dx: number, dy: number) {
    setImagery({ offsetX: Math.round((imagery.offsetX + dx) * 10) / 10, offsetY: Math.round((imagery.offsetY + dy) * 10) / 10 });
  }

  return (
    <PanelShell title={store.t("panel.background")} onClose={onClose}>
      <div className="flex flex-col gap-1.5">
        {IMAGERY.map((l) => (
          <Option key={l.id} active={imagery.id === l.id} title={l.name} subtitle={l.description} onClick={() => setImagery({ id: l.id })} />
        ))}
        {store.googleTiles
          ? GOOGLE_IMAGERY.map((l) => <Option key={l.id} active={imagery.id === l.id} title={l.name} subtitle={l.description} onClick={() => setImagery({ id: l.id })} />)
          : null}
        <Option active={imagery.id === NO_IMAGERY_ID} title="None" subtitle="Blank background — only the data" onClick={() => setImagery({ id: NO_IMAGERY_ID })} />
        <Option
          active={imagery.id === CUSTOM_IMAGERY_ID}
          title="Custom"
          subtitle="Your own XYZ tile URL (e.g. aerial imagery you're licensed to use)"
          onClick={() => setImagery({ id: CUSTOM_IMAGERY_ID })}
        />
      </div>

      {!store.googleTiles ? (
        <div className="text-[10px] text-[color:var(--text-muted)]">Google Satellite / Roads / Road mask appear here once the server has a GOOGLE_MAPS_API_KEY.</div>
      ) : null}

      {imagery.id === CUSTOM_IMAGERY_ID ? (
        <div>
          <input
            value={draftUrl}
            onChange={(e) => setDraftUrl(e.target.value)}
            onBlur={() => urlOk && setImagery({ customUrl: draftUrl })}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            placeholder="https://tiles.example.com/{z}/{x}/{y}.png"
            className={cn(inputClass, !urlOk && "border-[color:var(--text-danger)]")}
          />
          <div className={cn("mt-0.5 text-[10px]", urlOk ? "text-[color:var(--text-muted)]" : "text-[color:var(--text-danger)]")}>
            {urlOk ? "Must be http(s) and contain {z}, {x} and {y}. Falls back to OpenStreetMap until valid." : "Needs http(s):// and the {z}, {x}, {y} tokens."}
          </div>
        </div>
      ) : null}

      <div>
        <div className="mb-0.5 flex items-center justify-between text-[10px] text-[color:var(--text-muted)]">
          <span>Opacity</span>
          <span>{Math.round(imagery.opacity * 100)}%</span>
        </div>
        <input type="range" min={10} max={100} value={Math.round(imagery.opacity * 100)} onChange={(e) => setImagery({ opacity: Number(e.target.value) / 100 })} className="w-full" />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-[10px] text-[color:var(--text-muted)]">
          <span>Imagery offset (meters)</span>
          <button type="button" onClick={() => setImagery({ offsetX: 0, offsetY: 0 })} disabled={imagery.offsetX === 0 && imagery.offsetY === 0} className="inline-flex items-center gap-1 underline disabled:opacity-40">
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-3 gap-1">
            <span />
            <button type="button" aria-label="Nudge imagery north" className={nudgeBtn} onClick={() => nudge(0, 1)}>
              <ArrowUp className="h-3 w-3" />
            </button>
            <span />
            <button type="button" aria-label="Nudge imagery west" className={nudgeBtn} onClick={() => nudge(-1, 0)}>
              <ArrowLeft className="h-3 w-3" />
            </button>
            <span className="flex items-center justify-center text-[9px] text-[color:var(--text-muted)]">1 m</span>
            <button type="button" aria-label="Nudge imagery east" className={nudgeBtn} onClick={() => nudge(1, 0)}>
              <ArrowRight className="h-3 w-3" />
            </button>
            <span />
            <button type="button" aria-label="Nudge imagery south" className={nudgeBtn} onClick={() => nudge(0, -1)}>
              <ArrowDown className="h-3 w-3" />
            </button>
            <span />
          </div>
          <div className="font-mono text-[11px] text-[color:var(--text-secondary)]">
            <div>E/W {imagery.offsetX.toFixed(1)} m</div>
            <div>N/S {imagery.offsetY.toFixed(1)} m</div>
          </div>
        </div>
        <div className="mt-1 text-[10px] text-[color:var(--text-muted)]">Shifts the picture, not your data — use it to line imagery up with a known landmark before tracing.</div>
      </div>
    </PanelShell>
  );
}
