"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import { motion, type Variants } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Edit3,
  Inbox,
  Plus,
  RefreshCw,
  RotateCcw,
  SkipForward,
  Waves,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DataTable, { type ColumnDef } from "@/components/ui/DataTable";
import { GlassCard } from "@/features/shared/GlassCard";
import { cn } from "@/lib/utils";

import { fetchIngestStats, fetchRawIngests, retryIngest, updateIngestStatus } from "./api";
import SubmitIngestModal from "./SubmitIngestModal";
import BulkUpdateModal from "./BulkUpdateModal";
import type { IngestStatus, RawIngest } from "./types";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

const toneIconWrap: Record<Tone, string> = {
  neutral: "bg-white/5 text-white/70 ring-1 ring-inset ring-white/10",
  accent:
    "bg-[color:var(--orange-500)]/15 text-[color:var(--orange-400)] ring-1 ring-inset ring-[color:var(--orange-400)]/25",
  success:
    "bg-[color:var(--text-success)]/15 text-[color:var(--text-success)] ring-1 ring-inset ring-[color:var(--text-success)]/25",
  warning:
    "bg-[color:var(--text-warning)]/15 text-[color:var(--text-warning)] ring-1 ring-inset ring-[color:var(--text-warning)]/25",
  danger:
    "bg-[color:var(--text-danger)]/15 text-[color:var(--text-danger)] ring-1 ring-inset ring-[color:var(--text-danger)]/25",
};

const toneText: Record<Tone, string> = {
  neutral: "text-white",
  accent: "text-[color:var(--orange-400)]",
  success: "text-[color:var(--text-success)]",
  warning: "text-[color:var(--text-warning)]",
  danger: "text-[color:var(--text-danger)]",
};

const toneBadgeVariant: Record<Tone, string> = {
  neutral: "bg-white/5 text-white/70 border-white/10",
  accent:
    "bg-[color:var(--orange-500)]/15 text-[color:var(--orange-400)] border-[color:var(--orange-400)]/30",
  success:
    "bg-[color:var(--text-success)]/12 text-[color:var(--text-success)] border-[color:var(--text-success)]/25",
  warning:
    "bg-[color:var(--text-warning)]/12 text-[color:var(--text-warning)] border-[color:var(--text-warning)]/25",
  danger:
    "bg-[color:var(--text-danger)]/12 text-[color:var(--text-danger)] border-[color:var(--text-danger)]/25",
};

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

function StatusBadge({
  tone,
  children,
  fixed = false,
}: {
  tone: Tone;
  children: React.ReactNode;
  fixed?: boolean;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono tracking-wide text-[10px] px-2 py-0.5",
        fixed && "min-w-[92px] justify-center",
        toneBadgeVariant[tone],
      )}
    >
      {children}
    </Badge>
  );
}

function SectionEyebrow({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-0.5">
      <div className="flex items-center gap-2.5">
        <span className="h-px w-6 bg-white/20" />
        <span className="font-display text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/50">
          {label}
        </span>
      </div>
      {hint ? (
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/30">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

const STATUS_OPTIONS: IngestStatus[] = [
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

const CHANNEL_OPTIONS = ["TELEGRAM_BOT", "TELEGRAM_WEBHOOK", "WHATSAPP_WEBHOOK", "REST_API", "BATCH_IMPORT", "MANUAL"];

function statusTone(status: IngestStatus): Tone {
  if (status === "DONE") return "success";
  if (status === "FAILED") return "danger";
  if (status === "DUPLICATE" || status === "SKIPPED") return "warning";
  return "accent";
}

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

export default function RawIngestsPage() {
  const [rows, setRows] = useState<RawIngest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [statusFilter, setStatusFilter] = useState<IngestStatus | "">("");
  const [channelFilter, setChannelFilter] = useState("");
  const [submitOpen, setSubmitOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [ingests, stats] = await Promise.all([
      fetchRawIngests({
        status: statusFilter || undefined,
        channel: (channelFilter || undefined) as RawIngest["channel"] | undefined,
        limit: 50,
      }),
      fetchIngestStats(),
    ]);
    setRows(ingests.data);
    setTotal(ingests.total);
    setCounts(stats.counts);
    setLoading(false);
  }, [statusFilter, channelFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalToday = Object.values(counts).reduce((a, b) => a + b, 0);
  const doneCount = counts.DONE ?? 0;
  const failedCount = counts.FAILED ?? 0;
  const duplicateCount = counts.DUPLICATE ?? 0;
  const successRate = totalToday > 0 ? Math.round((doneCount / totalToday) * 100) : 0;

  const kpis: { label: string; value: string; icon: ComponentType<{ className?: string }>; tone: Tone; delta: string }[] = [
    {
      label: "Total Ingests",
      value: totalToday.toLocaleString(),
      icon: Waves,
      tone: "accent",
      delta: "across all statuses",
    },
    {
      label: "Completed",
      value: doneCount.toLocaleString(),
      icon: CheckCircle2,
      tone: "success",
      delta: `${successRate}% success rate`,
    },
    {
      label: "Duplicates",
      value: duplicateCount.toLocaleString(),
      icon: Copy,
      tone: "warning",
      delta: "auto-flagged",
    },
    {
      label: "Failed",
      value: failedCount.toLocaleString(),
      icon: AlertTriangle,
      tone: "danger",
      delta: "retry or skip",
    },
  ];

  async function handleRetry(row: RawIngest) {
    await retryIngest(row.id);
    void load();
  }

  async function handleSkip(row: RawIngest) {
    await updateIngestStatus(row.id, "SKIPPED");
    void load();
  }

  // Recomputed every render (cheap, small dataset) rather than memoized, so
  // the row actions always close over the current `load` (which itself
  // changes identity whenever the filters change).
  const columns: ColumnDef<RawIngest>[] = [
      {
        id: "id",
        header: "ID",
        size: 110,
        cell: ({ row }) => (
          <span className="font-mono text-[11px] text-white/70">{row.original.id.slice(0, 8)}…</span>
        ),
      },
      {
        accessorKey: "channel",
        header: "Channel",
        size: 130,
        cell: ({ row }) => <StatusBadge tone="accent">{row.original.channel}</StatusBadge>,
      },
      {
        id: "type",
        header: "Type",
        size: 110,
        cell: ({ row }) => (
          <span className="text-[11.5px] text-white/75">{row.original.message_type ?? "—"}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 120,
        cell: ({ row }) => (
          <StatusBadge tone={statusTone(row.original.status)} fixed>
            {row.original.status}
          </StatusBadge>
        ),
      },
      {
        accessorKey: "received_at",
        header: "Received",
        size: 110,
        cell: ({ row }) => (
          <span className="text-[11.5px] text-white/55">{timeAgo(row.original.received_at)}</span>
        ),
      },
      {
        accessorKey: "retry_count",
        header: "Retries",
        size: 90,
        cell: ({ row }) => (
          <span
            className={cn(
              "font-mono text-[11.5px] tabular-nums",
              row.original.retry_count > 0 ? "text-[color:var(--text-warning)]" : "text-white/55",
            )}
          >
            {row.original.retry_count}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        size: 140,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void handleRetry(row.original);
              }}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10.5px] font-medium text-white/75 transition hover:bg-white/[0.08] hover:text-white"
            >
              <RotateCcw className="h-3 w-3" />
              Retry
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void handleSkip(row.original);
              }}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10.5px] font-medium text-white/60 transition hover:bg-white/[0.08] hover:text-white/85"
            >
              <SkipForward className="h-3 w-3" />
              Skip
            </button>
          </div>
        ),
      },
  ];

  return (
    <div
      className="view active relative min-h-full overflow-hidden bg-[color:var(--surface-0)] px-6 pt-10 pb-8 md:px-10 md:pt-14 md:pb-10 xl:px-14 xl:pt-16 xl:pb-12"
      id="v-ingests"
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
              <span className="inline-flex h-2 w-2 rounded-full bg-[color:var(--text-success)] pulse-dot" />
              <span className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
                Live · Data › Ingestion Pipeline
              </span>
            </div>
            <h2 className="font-display-tight mt-2 text-[32px] font-semibold text-white">
              Raw Ingests
            </h2>
            <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/55">
              Monitor and manage incoming raw data ingestion records.
              <span className="ml-1 text-[color:var(--orange-400)]">
                {total} record{total === 1 ? "" : "s"} matching filters
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="glass-surface glass-glow relative inline-flex items-center gap-1.5 rounded-lg border-0 px-3 py-1.5 text-[12px] font-medium text-white/85 transition hover:text-white"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setBulkOpen(true)}
              className="glass-surface glass-glow relative inline-flex items-center gap-1.5 rounded-lg border-0 px-3 py-1.5 text-[12px] font-medium text-white/85 transition hover:text-white"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Bulk update
            </button>
            <button
              type="button"
              onClick={() => setSubmitOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--orange-400)]/30 bg-[color:var(--orange-500)]/12 px-3 py-1.5 text-[12px] font-medium text-[color:var(--orange-400)] transition hover:bg-[color:var(--orange-500)]/20"
            >
              <Plus className="h-3.5 w-3.5" />
              Submit ingest
            </button>
          </div>
        </motion.div>

        {/* KPIs */}
        <motion.section variants={item} className="flex flex-col gap-3">
          <SectionEyebrow label="Pipeline Snapshot" hint="all time" />
          <motion.div
            variants={container}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4"
          >
            {kpis.map((k) => {
              const Icon = k.icon;
              return (
                <motion.div key={k.label} variants={item} whileHover={{ y: -4 }}>
                  <GlassCard ring ringTone={k.tone} className="h-full">
                    <div className="relative flex h-full min-h-[168px] flex-col items-center justify-center p-6 text-center">
                      <div
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-2xl",
                          toneIconWrap[k.tone],
                        )}
                      >
                        <Icon className="h-[19px] w-[19px]" />
                      </div>
                      <div className="font-display mt-4 text-[11px] font-medium uppercase tracking-[0.14em] text-white/55">
                        {k.label}
                      </div>
                      <div
                        className={cn(
                          "font-display-tight mt-2 text-[26px] font-semibold tabular-nums leading-none",
                          toneText[k.tone],
                        )}
                      >
                        {k.value}
                      </div>
                      <div className="mt-2.5 text-[11px] text-white/55">
                        {k.delta}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.section>

        {/* Ingest table */}
        <motion.div variants={item}>
          <GlassCard>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 px-6 pb-0 pt-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 ring-1 ring-inset ring-white/10">
                  <Inbox className="h-4 w-4 text-white/75" />
                </div>
                <CardTitle className="font-display text-[14px] font-semibold text-white/90">
                  Ingest Records
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as IngestStatus | "")}
                  className="appearance-none rounded-lg border border-white/10 bg-white/[0.04] py-1.5 pl-3 pr-8 text-[11.5px] text-white/80 outline-none transition hover:bg-white/[0.07] focus:border-[color:var(--orange-400)]/40"
                >
                  <option value="">All statuses</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                  className="appearance-none rounded-lg border border-white/10 bg-white/[0.04] py-1.5 pl-3 pr-8 text-[11.5px] text-white/80 outline-none transition hover:bg-white/[0.07] focus:border-[color:var(--orange-400)]/40"
                >
                  <option value="">All channels</option>
                  {CHANNEL_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-5">
              <DataTable
                columns={columns}
                data={rows}
                loading={loading}
                emptyMessage="No raw ingests match these filters."
              />
            </CardContent>
          </GlassCard>
        </motion.div>
      </motion.div>

      <SubmitIngestModal
        isOpen={submitOpen}
        onClose={() => setSubmitOpen(false)}
        onSubmitted={() => void load()}
      />
      <BulkUpdateModal
        isOpen={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onApplied={() => void load()}
      />
    </div>
  );
}
