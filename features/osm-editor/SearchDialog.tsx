"use client";

// Search (Ctrl/Cmd+F) — iD's feature search. One box that understands:
//   a place        "9.02, 38.8" · "17/9.02/38.8" · "17/79640/62234" · a map link
//   an element id  "w123" · "node/45" · an openstreetmap.org URL
//   a feature name matched against everything currently loaded
// Arrow keys move through results, Enter picks the highlighted one.

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Route, Search, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { goTo } from "./navigate";
import { formatTile, parseLocationInput, type ParsedLocation } from "./lib/location";
import { nodeRole, wayRole } from "./lib/geometryRoles";
import { matchPreset } from "./lib/presets";
import type { Entity } from "./lib/graph";
import type { EditorStore } from "./useEditorStore";

interface Row {
  key: string;
  title: string;
  subtitle: string;
  kind: "place" | "feature";
  entity?: Entity;
  target?: ParsedLocation;
}

const MAX_FEATURES = 25;

function describeTarget(t: ParsedLocation): { title: string; subtitle: string } {
  switch (t.kind) {
    case "latlon":
      return { title: `Go to ${t.lat.toFixed(5)}, ${t.lon.toFixed(5)}`, subtitle: t.zoom !== undefined ? `at zoom ${t.zoom}` : "coordinates" };
    case "tile":
      return { title: `Go to tile ${formatTile(t.tile)}`, subtitle: "draws the tile as a boundary" };
    case "element":
      return { title: `Find ${t.type} #${t.id}`, subtitle: "by id" };
    case "bounds":
      return { title: "Go to bounds", subtitle: "" };
  }
}

export default function SearchDialog({ store, onClose }: { store: EditorStore; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    const text = q.trim();
    if (!text) return out;
    const target = parseLocationInput(text);
    if (target) out.push({ key: "target", kind: "place", target, ...describeTarget(target) });

    const needle = text.toLowerCase();
    const scored: { score: number; row: Row }[] = [];
    const consider = (e: Entity, geometry: "point" | "vertex" | "line" | "area" | null) => {
      const name = (e.tags.name ?? "").toLowerCase();
      const preset = geometry ? matchPreset(e.tags, geometry) : null;
      const shortId = `${e.type[0]}${e.id}`;
      let score = 0;
      if (name === needle) score = 100;
      else if (name.startsWith(needle)) score = 80;
      else if (name.includes(needle)) score = 60;
      else if (shortId === needle) score = 90;
      else if (preset && preset.name.toLowerCase().includes(needle)) score = 30;
      else if (Object.values(e.tags).some((v) => v.toLowerCase().includes(needle))) score = 20;
      if (score === 0) return;
      scored.push({
        score,
        row: {
          key: shortId,
          kind: "feature",
          entity: e,
          title: e.tags.name || preset?.name || `${e.type} #${e.id}`,
          subtitle: `${preset?.name ?? e.type} · ${e.type} #${e.id}`,
        },
      });
    };
    for (const n of store.graph.visibleNodes()) {
      // Untagged vertices are just shape points — never search hits.
      if (Object.keys(n.tags).length > 0) consider(n, nodeRole(store.graph, n));
    }
    for (const w of store.graph.visibleWays()) if (Object.keys(w.tags).length > 0) consider(w, wayRole(w));
    for (const r of store.graph.visibleRelations()) consider(r, null);
    scored.sort((a, b) => b.score - a.score);
    for (const s of scored.slice(0, MAX_FEATURES)) out.push(s.row);
    return out;
  }, [q, store.graph]);

  // Clamp rather than reset: typing changes the list under the cursor.
  const current = Math.min(active, Math.max(0, rows.length - 1));

  async function pick(row: Row | undefined) {
    if (!row) return;
    if (row.kind === "place" && row.target) {
      await goTo(store, row.target, { load: store.autoLoad });
    } else if (row.entity) {
      await goTo(store, { kind: "element", type: row.entity.type, id: row.entity.id }, { load: false });
    }
    onClose();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(Math.min(current + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(Math.max(current - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      void pick(rows[current]);
    }
  }

  return (
    <div className="fixed inset-0 z-[1200] flex items-start justify-center bg-black/40 p-4 pt-24" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-[30rem] max-w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] text-[12px] shadow-2xl">
        <div className="flex items-center gap-2 border-b border-[color:var(--border)] px-3 py-2">
          <Search className="h-3.5 w-3.5 text-[color:var(--text-muted)]" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder={store.t("dialog.searchPlaceholder")}
            className="flex-1 bg-transparent text-[13px] text-[color:var(--text-primary)] outline-none"
          />
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-[color:var(--text-muted)] transition hover:bg-[color:var(--surface-3)]">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto p-1.5">
          {q.trim() === "" ? (
            <div className="px-2 py-3 text-[11px] text-[color:var(--text-muted)]">
              Try a name, <code>9.02, 38.8</code>, <code>17/79640/62234</code> or <code>w123</code>. Only features in the loaded area are searched by name.
            </div>
          ) : rows.length === 0 ? (
            <div className="px-2 py-3 text-[11px] text-[color:var(--text-muted)]">Nothing matches in the loaded area.</div>
          ) : (
            rows.map((row, i) => {
              const Icon = row.kind === "place" ? MapPin : row.entity?.type === "way" ? Route : row.entity?.type === "relation" ? Square : MapPin;
              return (
                <button
                  key={row.key}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => void pick(row)}
                  className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition", i === current ? "bg-[color:var(--surface-3)]" : "hover:bg-[color:var(--surface-3)]")}
                >
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", row.kind === "place" ? "text-[color:var(--orange-400)]" : "text-[color:var(--text-muted)]")} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] text-[color:var(--text-primary)]">{row.title}</span>
                    <span className="block truncate text-[10px] text-[color:var(--text-muted)]">{row.subtitle}</span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
