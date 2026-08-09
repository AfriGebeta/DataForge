"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { AlertOctagon, MailWarning, RefreshCw, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DataTable, { type ColumnDef } from "@/components/ui/DataTable";
import { GlassCard } from "@/features/shared/GlassCard";
import { cn } from "@/lib/utils";

import { fetchDeadLetters, replayDeadLetter } from "./api";
import type { DeadLetter } from "./types";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 220, damping: 24 },
  },
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const s = Math.max(0, Math.floor(diffMs / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function DeadLettersPage() {
  const [rows, setRows] = useState<DeadLetter[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [queueFilter, setQueueFilter] = useState("");
  const [replayedFilter, setReplayedFilter] = useState<"" | "true" | "false">("false");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchDeadLetters({
      queue: queueFilter || undefined,
      replayed: replayedFilter === "" ? undefined : replayedFilter === "true",
      limit: 100,
    });
    setRows(res.data);
    setTotal(res.total);
    setLoading(false);
  }, [queueFilter, replayedFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const queues = useMemo(() => Array.from(new Set(rows.map((r) => r.source_queue))), [rows]);

  async function handleReplay(row: DeadLetter) {
    await replayDeadLetter(row.id);
    void load();
  }

  const failedCount = rows.filter((r) => !r.is_replayed).length;

  // Recomputed every render (cheap, small dataset) rather than memoized, so
  // the replay action always closes over the current `load`.
  const columns: ColumnDef<DeadLetter>[] = [
      {
        id: "id",
        header: "ID",
        size: 100,
        cell: ({ row }) => (
          <span className="font-mono text-[11px] text-white/70">{row.original.id.slice(0, 8)}…</span>
        ),
      },
      {
        accessorKey: "source_queue",
        header: "Queue",
        size: 180,
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono tracking-wide text-[10px] px-2 py-0.5 bg-white/5 text-white/70 border-white/10">
            {row.original.source_queue}
          </Badge>
        ),
      },
      {
        accessorKey: "error_message",
        header: "Error",
        size: 260,
        cell: ({ row }) => (
          <span className="text-[11.5px] text-[color:var(--text-danger)]">{row.original.error_message}</span>
        ),
      },
      {
        accessorKey: "retry_count",
        header: "Retries",
        size: 90,
        cell: ({ row }) => (
          <span className="font-mono text-[11.5px] tabular-nums text-[color:var(--text-warning)]">
            {row.original.retry_count}
          </span>
        ),
      },
      {
        accessorKey: "failed_at",
        header: "Failed",
        size: 100,
        cell: ({ row }) => (
          <span className="text-[11.5px] text-white/55">{timeAgo(row.original.failed_at)}</span>
        ),
      },
      {
        accessorKey: "is_replayed",
        header: "Replayed",
        size: 100,
        cell: ({ row }) =>
          row.original.is_replayed ? (
            <Badge variant="outline" className="font-mono tracking-wide text-[10px] px-2 py-0.5 bg-[color:var(--text-success)]/12 text-[color:var(--text-success)] border-[color:var(--text-success)]/25">
              Replayed
            </Badge>
          ) : (
            <span className="text-[11px] text-white/40">—</span>
          ),
      },
      {
        id: "actions",
        header: "",
        size: 110,
        enableSorting: false,
        cell: ({ row }) => (
          <button
            type="button"
            disabled={row.original.is_replayed}
            onClick={(e) => {
              e.stopPropagation();
              void handleReplay(row.original);
            }}
            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10.5px] font-medium text-white/75 transition hover:bg-white/[0.08] hover:text-white disabled:pointer-events-none disabled:opacity-30"
          >
            <RotateCcw className="h-3 w-3" />
            Replay
          </button>
        ),
      },
  ];

  return (
    <div
      className="view active relative min-h-full overflow-hidden bg-[color:var(--surface-0)] px-6 pt-10 pb-8 md:px-10 md:pt-14 md:pb-10 xl:px-14 xl:pt-16 xl:pb-12"
      id="v-dlq"
    >
      <div className="aurora-bg" aria-hidden />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col gap-10"
      >
        {/* Header */}
        <motion.div
          variants={item}
          className="flex flex-wrap items-start justify-between gap-5 pb-2"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-[color:var(--text-danger)] pulse-dot" />
              <span className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
                Live · Data › Failure Queue
              </span>
            </div>
            <h2 className="font-display-tight mt-2 text-[32px] font-semibold text-white">
              Dead Letters
            </h2>
            <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/55">
              Messages that failed all retry attempts and are queued for manual review.
              <span className="ml-1 text-[color:var(--text-danger)]">
                {total} matching filter{total === 1 ? "" : "s"}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1.5 border-[color:var(--text-danger)]/30 bg-[color:var(--text-danger)]/12 py-1 pl-2 pr-2.5 text-[color:var(--text-danger)]"
            >
              <AlertOctagon className="h-3 w-3" />
              {failedCount} Awaiting replay
            </Badge>
            <button
              type="button"
              onClick={() => void load()}
              className="glass-surface glass-glow relative inline-flex items-center gap-1.5 rounded-lg border-0 px-3 py-1.5 text-[12px] font-medium text-white/85 transition hover:text-white"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Dead letter table */}
        <motion.div variants={item}>
          <GlassCard tone="danger">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 px-6 pb-0 pt-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--text-danger)]/15 text-[color:var(--text-danger)] ring-1 ring-inset ring-[color:var(--text-danger)]/25">
                  <MailWarning className="h-4 w-4" />
                </div>
                <CardTitle className="font-display text-[14px] font-semibold text-white/90">
                  Failed Messages
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={queueFilter}
                  onChange={(e) => setQueueFilter(e.target.value)}
                  className="appearance-none rounded-lg border border-white/10 bg-white/[0.04] py-1.5 pl-3 pr-8 text-[11.5px] text-white/80 outline-none transition hover:bg-white/[0.07] focus:border-[color:var(--orange-400)]/40"
                >
                  <option value="">All queues</option>
                  {queues.map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
                <select
                  value={replayedFilter}
                  onChange={(e) => setReplayedFilter(e.target.value as "" | "true" | "false")}
                  className="appearance-none rounded-lg border border-white/10 bg-white/[0.04] py-1.5 pl-3 pr-8 text-[11.5px] text-white/80 outline-none transition hover:bg-white/[0.07] focus:border-[color:var(--orange-400)]/40"
                >
                  <option value="false">Not replayed</option>
                  <option value="true">Replayed</option>
                  <option value="">All</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-5">
              <DataTable
                columns={columns}
                data={rows}
                loading={loading}
                emptyMessage="No dead-lettered messages match these filters."
              />
            </CardContent>
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
