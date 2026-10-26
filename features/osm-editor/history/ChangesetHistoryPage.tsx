"use client";

// Changeset history — the OSM website's /history page: who edited what,
// when, how much (per-type created/modified/deleted), and where. Rows
// expand to full detail, can be downloaded as a real osmChange file, and
// jump the editor to the changeset's area.

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Download, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadTextFile, fetchChangesetOsmChangeXml, listChangesets } from "../api";
import { formatMapParam } from "../lib/location";
import type { ChangeCount, OsmChangesetSummary } from "../types";

const PAGE_SIZE = 20;

const inputClass =
  "rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-2.5 py-1.5 text-[12px] text-[color:var(--text-primary)] outline-none focus:border-[color:var(--orange-400)]/50";
const buttonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1.5 text-[12px] font-medium text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-3)] disabled:opacity-40";

type StatusFilter = "all" | "open" | "closed";

function Counts({ label, c }: { label: string; c: ChangeCount }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="text-[color:var(--text-secondary)]">{label}</span>
      <span className="font-mono text-[11px]">
        <span className="text-[color:var(--text-success)]">+{c.created}</span>{" "}
        <span className="text-[color:var(--text-warning)]">~{c.modified}</span>{" "}
        <span className="text-[color:var(--text-danger)]">-{c.deleted}</span>
      </span>
    </div>
  );
}

function totals(cs: OsmChangesetSummary) {
  const all = [cs.counts.nodes, cs.counts.ways, cs.counts.relations];
  return {
    created: all.reduce((n, c) => n + c.created, 0),
    modified: all.reduce((n, c) => n + c.modified, 0),
    deleted: all.reduce((n, c) => n + c.deleted, 0),
  };
}

function editorLink(cs: OsmChangesetSummary): string | null {
  if (cs.minLat === undefined || cs.maxLat === undefined || cs.minLon === undefined || cs.maxLon === undefined) return null;
  const lat = (cs.minLat + cs.maxLat) / 2;
  const lon = (cs.minLon + cs.maxLon) / 2;
  return `/osm-editor#map=${formatMapParam(17, lat, lon)}`;
}

function Row({ cs }: { cs: OsmChangesetSummary }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const t = totals(cs);
  const link = editorLink(cs);
  const comment = cs.tags.comment || "(no comment)";

  async function download() {
    setBusy(true);
    setErr(null);
    try {
      downloadTextFile(`changeset-${cs.id}.osc`, await fetchChangesetOsmChangeXml(cs.id));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <tr className="cursor-pointer border-b border-[color:var(--border)] transition hover:bg-[color:var(--surface-3)]" onClick={() => setOpen((o) => !o)}>
        <td className="w-6 py-2 pl-3 text-[color:var(--text-muted)]">{open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}</td>
        <td className="px-2 py-2 font-mono text-[12px] text-[color:var(--text-secondary)]">#{cs.id}</td>
        <td className="max-w-[22rem] truncate px-2 py-2 text-[12px] text-[color:var(--text-primary)]" title={comment}>
          {comment}
        </td>
        <td className="px-2 py-2 text-[12px] text-[color:var(--text-secondary)]">{cs.userFullName || cs.userEmail || cs.userId.slice(0, 8)}</td>
        <td className="whitespace-nowrap px-2 py-2 text-[12px] text-[color:var(--text-secondary)]">{new Date(cs.createdAt).toLocaleString()}</td>
        <td className="px-2 py-2 font-mono text-[11px]">
          <span className="text-[color:var(--text-success)]">+{t.created}</span> <span className="text-[color:var(--text-warning)]">~{t.modified}</span>{" "}
          <span className="text-[color:var(--text-danger)]">-{t.deleted}</span>
        </td>
        <td className="px-2 py-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium",
              cs.open ? "bg-[color:var(--text-success)]/15 text-[color:var(--text-success)]" : "bg-[color:var(--surface-3)] text-[color:var(--text-muted)]",
            )}
          >
            {cs.open ? "Open" : "Closed"}
          </span>
        </td>
      </tr>
      {open ? (
        <tr className="border-b border-[color:var(--border)] bg-[color:var(--surface-1)]">
          <td />
          <td colSpan={6} className="px-2 py-3">
            <div className="grid gap-6 text-[12px] md:grid-cols-3">
              <div className="flex flex-col gap-1">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">Changes ({cs.numChanges})</div>
                <Counts label="Nodes" c={cs.counts.nodes} />
                <Counts label="Ways" c={cs.counts.ways} />
                <Counts label="Relations" c={cs.counts.relations} />
              </div>
              <div>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">Tags</div>
                {Object.keys(cs.tags).length === 0 ? (
                  <span className="text-[color:var(--text-muted)]">None</span>
                ) : (
                  Object.entries(cs.tags).map(([k, v]) => (
                    <div key={k} className="truncate">
                      <span className="text-[color:var(--text-muted)]">{k}</span> = {v}
                    </div>
                  ))
                )}
              </div>
              <div className="flex flex-col items-start gap-2">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">Area</div>
                {link ? (
                  <>
                    <span className="font-mono text-[11px] text-[color:var(--text-secondary)]">
                      {cs.minLat?.toFixed(4)}, {cs.minLon?.toFixed(4)} → {cs.maxLat?.toFixed(4)}, {cs.maxLon?.toFixed(4)}
                    </span>
                    <Link href={link} className={buttonClass}>
                      <MapPin className="h-3.5 w-3.5" />
                      Open area in editor
                    </Link>
                  </>
                ) : (
                  <span className="text-[color:var(--text-muted)]">No edits yet.</span>
                )}
                <button type="button" onClick={() => void download()} disabled={busy} className={buttonClass}>
                  <Download className="h-3.5 w-3.5" />
                  {busy ? "Preparing…" : "Download osmChange"}
                </button>
                {err ? <span className="text-[color:var(--text-danger)]">{err}</span> : null}
                <span className="text-[10px] text-[color:var(--text-muted)]">
                  Opened {new Date(cs.createdAt).toLocaleString()} · {cs.open ? "closes" : "closed"} {new Date(cs.closedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

export default function ChangesetHistoryPage() {
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [offset, setOffset] = useState(0);
  // ?changeset=N narrows the list to one changeset (the History panel links here).
  const searchParams = useSearchParams();
  const initialId = Number(searchParams.get("changeset"));
  const [onlyId, setOnlyId] = useState<number | null>(Number.isInteger(initialId) && initialId > 0 ? initialId : null);
  // Filters apply on "Search" (or Enter), not per keystroke.
  const [applied, setApplied] = useState({ comment: "", status: "all" as StatusFilter, from: "", to: "" });

  const [items, setItems] = useState<OsmChangesetSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listChangesets({
        ids: onlyId ? [onlyId] : undefined,
        comment: applied.comment || undefined,
        open: applied.status === "all" ? undefined : applied.status === "open",
        from: applied.from || undefined,
        to: applied.to || undefined,
        limit: PAGE_SIZE,
        offset,
      });
      setItems(res.changesets);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load changesets");
    } finally {
      setLoading(false);
    }
  }, [applied, offset, onlyId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => void load(), [load]);

  function search() {
    setOffset(0);
    setApplied({ comment: comment.trim(), status, from, to });
  }

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto p-4">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-0.5 block text-[10px] text-[color:var(--text-muted)]">Comment contains</label>
          <input value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="e.g. roads" className={cn(inputClass, "w-56")} />
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] text-[color:var(--text-muted)]">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className={inputClass}>
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] text-[color:var(--text-muted)]">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] text-[color:var(--text-muted)]">To (exclusive)</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} />
        </div>
        <button type="button" onClick={search} className={buttonClass}>
          <Search className="h-3.5 w-3.5" />
          Search
        </button>
        <Link href="/osm-editor" className={cn(buttonClass, "ml-auto")}>
          Back to the editor
        </Link>
      </div>

      {onlyId ? (
        <div className="flex items-center gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 py-1.5 text-[12px] text-[color:var(--text-secondary)]">
          Showing only changeset #{onlyId}
          <button type="button" className="underline" onClick={() => setOnlyId(null)}>
            Show all
          </button>
        </div>
      ) : null}

      {error ? <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 py-2 text-[12px] text-[color:var(--text-danger)]">{error}</div> : null}

      <div className="overflow-x-auto rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)]">
        <table className="w-full min-w-[56rem] text-left">
          <thead>
            <tr className="border-b border-[color:var(--border)] text-[10px] uppercase tracking-wide text-[color:var(--text-muted)]">
              <th className="w-6" />
              <th className="px-2 py-2 font-medium">Changeset</th>
              <th className="px-2 py-2 font-medium">Comment</th>
              <th className="px-2 py-2 font-medium">User</th>
              <th className="px-2 py-2 font-medium">Created</th>
              <th className="px-2 py-2 font-medium">Changes</th>
              <th className="px-2 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((cs) => (
              <Row key={cs.id} cs={cs} />
            ))}
            {!loading && items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-[12px] text-[color:var(--text-muted)]">
                  No changesets match.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-[12px] text-[color:var(--text-muted)]">
        <span>
          {loading ? "Loading…" : `${total} changeset${total === 1 ? "" : "s"}`} · page {page} of {pages}
        </span>
        <span className="flex gap-2">
          <button type="button" className={buttonClass} disabled={offset === 0 || loading} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>
            Newer
          </button>
          <button type="button" className={buttonClass} disabled={offset + PAGE_SIZE >= total || loading} onClick={() => setOffset(offset + PAGE_SIZE)}>
            Older
          </button>
        </span>
      </div>
    </div>
  );
}
