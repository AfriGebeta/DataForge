"use client";

// Walkthrough — a guided tour of the editor, like iD's. Unlike iD's, which
// runs a scripted lesson on a sample graph, this runs in the live editor and
// each step offers a button that opens the real feature it's describing (Go
// to, Issues, shortcuts…), so nothing in it can drift from how the editor
// actually works. Nothing here edits data.

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TourActions {
  openGoTo: () => void;
  openSearch: () => void;
  openIssues: () => void;
  openBackground: () => void;
  openShortcuts: () => void;
  openAutoTrace: () => void;
}

interface Step {
  title: string;
  body: string[];
  action?: { label: string; run: (a: TourActions) => void };
}

const STEPS: Step[] = [
  {
    title: "Welcome",
    body: [
      "This editor works like OpenStreetMap's iD: you draw and tag points, lines and areas, review your changes, and save them together as one changeset.",
      "This two-minute tour covers moving around, loading data, editing, checking your work and saving. Nothing in it changes any data.",
    ],
  },
  {
    title: "Moving around",
    body: [
      "Drag to pan, scroll to zoom — or use the arrow keys and + / −. Hold Alt with them to move further.",
      "To jump somewhere exact, press Ctrl/Cmd+G and enter latitude/longitude, a tile (z/x/y) or a bounding box. Ctrl/Cmd+F searches names, coordinates and element ids like w123.",
      "The address bar always holds your view (#map=zoom/lat/lng), so any link you copy reopens the same place.",
    ],
    action: { label: "Try Go to…", run: (a) => a.openGoTo() },
  },
  {
    title: "Loading data",
    body: [
      "Zoom in to level 16 or closer, then click “Load / refresh view” to fetch what's there. Go to can load an area for you too.",
      "Loading replaces the map you see, so the editor refuses to do it automatically while you have unsaved edits.",
    ],
  },
  {
    title: "Starting to edit",
    body: [
      "Click “Start editing session” to open a changeset — a named bundle of changes (add a short comment saying what you're doing).",
      "You don't need a session to look around, search, or leave a note (N).",
    ],
  },
  {
    title: "Adding things",
    body: [
      "Press 1 for a point, 2 for a line, 3 for an area. Click (or press Space) to place each point; Enter or Esc finishes. Hold Alt to turn snapping off for a click.",
      "To extend an existing line, select its end vertex and press A (Continue). Press F while drawing to follow an existing way.",
    ],
  },
  {
    title: "Changing things",
    body: [
      "Click a feature to select it. The sidebar shows a preset (what it is) and fields — names in several languages, address, opening hours, phone — plus the raw tag table underneath.",
      "Right-click for the edit menu, or use the letters: M move, R rotate, S straighten, Q square corners, O circle, C merge, D disconnect, X split, V reverse, E extract. Backspace downgrades, Delete deletes.",
      "Shift+A (or 8) copies one feature's tags onto another.",
    ],
    action: { label: "Show all shortcuts", run: (a) => a.openShortcuts() },
  },
  {
    title: "Checking your work",
    body: [
      "The Issues panel (I) lists problems — crossing roads, unconnected ends, missing tags, bad phone formats — and most have a one-click fix. “My edits” checks only what you touched; “Everything loaded” checks the whole view.",
      "The History panel shows a feature's earlier versions and exactly which tags changed.",
    ],
    action: { label: "Open Issues", run: (a) => a.openIssues() },
  },
  {
    title: "Saving",
    body: [
      "Save (Ctrl/Cmd+S) shows a review of what you created, changed and deleted, and blocks the upload if there are errors.",
      "If someone else edited the same thing meanwhile you'll get a conflict message — reload the area and re-apply your change. Your unsaved edits are also kept in this browser in case the tab crashes.",
    ],
  },
  {
    title: "More tools",
    body: [
      "Background (B) switches imagery, with opacity and an offset to line aerial photos up with the ground. Auto-trace draws roads from a road-mask image for you to review.",
      "Press ? any time for every shortcut, and P for preferences — including the interface language.",
    ],
    action: { label: "Open Background", run: (a) => a.openBackground() },
  },
];

export default function Walkthrough({ actions, onClose }: { actions: TourActions; onClose: () => void }) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;
  return (
    <div className="absolute bottom-14 left-1/2 z-[1150] w-[28rem] max-w-[calc(100%-24px)] -translate-x-1/2 rounded-lg border border-[color:var(--orange-400)]/40 bg-[color:var(--surface-2)] p-3 text-[12px] shadow-2xl" role="dialog" aria-label="Editor tour">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-[color:var(--text-primary)]">
          {step.title} <span className="font-normal text-[color:var(--text-muted)]">· {i + 1}/{STEPS.length}</span>
        </span>
        <button type="button" onClick={onClose} aria-label="Close the tour" className="rounded-md p-1 text-[color:var(--text-muted)] transition hover:bg-[color:var(--surface-3)]">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex flex-col gap-1.5 text-[color:var(--text-secondary)]">
        {step.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="flex gap-1" aria-hidden>
          {STEPS.map((_, n) => (
            <span key={n} className={cn("h-1.5 w-1.5 rounded-full", n === i ? "bg-[color:var(--orange-400)]" : "bg-[color:var(--border)]")} />
          ))}
        </span>
        <span className="flex items-center gap-1.5">
          {step.action ? (
            <button type="button" onClick={() => step.action!.run(actions)} className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-1)] px-2.5 py-1 text-[11px] font-medium text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-3)]">
              {step.action.label}
            </button>
          ) : null}
          <button type="button" disabled={i === 0} onClick={() => setI(i - 1)} aria-label="Previous step" className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-1)] p-1 text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-3)] disabled:opacity-40">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          {last ? (
            <button type="button" onClick={onClose} className="rounded-lg border border-[color:var(--orange-400)]/30 bg-[color:var(--orange-500)]/12 px-3 py-1 text-[11px] font-medium text-[color:var(--orange-400)] transition hover:bg-[color:var(--orange-500)]/20">
              Done
            </button>
          ) : (
            <button type="button" onClick={() => setI(i + 1)} aria-label="Next step" className="rounded-lg border border-[color:var(--orange-400)]/30 bg-[color:var(--orange-500)]/12 p-1 text-[color:var(--orange-400)] transition hover:bg-[color:var(--orange-500)]/20">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </span>
      </div>
    </div>
  );
}
