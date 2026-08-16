"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import { motion, type Variants } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Database,
  Hexagon,
  Plus,
  RefreshCw,
  Waves,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GlassCard } from "@/features/shared/GlassCard";
import { cn } from "@/lib/utils";

import ChannelFormModal from "../channels/ChannelFormModal";
import type { ChannelConfig } from "../channels/types";
import { fetchIngestStats } from "../raw-ingests/api";
import { fetchDataSourcesOverview } from "./api";
import type { SourceHealthSummary } from "./types";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

const toneIconWrap: Record<Tone, string> = {
  neutral: "bg-[color:var(--surface-2)] text-[color:var(--text-secondary)] ring-1 ring-inset ring-[color:var(--border)]",
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
  neutral: "text-[color:var(--text-primary)]",
  accent: "text-[color:var(--orange-400)]",
  success: "text-[color:var(--text-success)]",
  warning: "text-[color:var(--text-warning)]",
  danger: "text-[color:var(--text-danger)]",
};

const toneBadgeVariant: Record<Tone, string> = {
  neutral: "bg-[color:var(--surface-2)] text-[color:var(--text-secondary)] border-[color:var(--border)]",
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

function StatusBadge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-mono tracking-wide text-[10px] px-2 py-0.5", toneBadgeVariant[tone])}
    >
      {children}
    </Badge>
  );
}

function SectionEyebrow({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-0.5">
      <div className="flex items-center gap-2.5">
        <span className="h-px w-6 bg-[color:var(--surface-3)]" />
        <span className="font-display text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-muted)]">
          {label}
        </span>
      </div>
      {hint ? (
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
          {hint}
        </span>
      ) : null}
    </div>
  );
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

const STATUS_COLORS: Record<string, string> = {
  DONE: "bg-[color:var(--text-success)]",
  FAILED: "bg-[color:var(--text-danger)]",
  DUPLICATE: "bg-[color:var(--text-warning)]",
  SKIPPED: "bg-[color:var(--surface-3)]",
};

export default function DataSourcesPage() {
  const [channels, setChannels] = useState<ChannelConfig[]>([]);
  const [summary, setSummary] = useState<SourceHealthSummary>({
    totalIngests: 0,
    doneCount: 0,
    failedCount: 0,
    successRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [breakdownChannel, setBreakdownChannel] = useState("");
  const [breakdown, setBreakdown] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const overview = await fetchDataSourcesOverview();
    setChannels(overview.channels);
    setSummary(overview.summary);
    if (!breakdownChannel && overview.channels.length > 0) {
      setBreakdownChannel(overview.channels[0].channel);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!breakdownChannel) {
      setBreakdown({});
      return;
    }
    void fetchIngestStats(breakdownChannel).then((res) => setBreakdown(res.counts));
  }, [breakdownChannel]);

  const activeChannels = channels.filter((c) => c.is_active);
  const breakdownTotal = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const distinctChannelTypes = Array.from(new Set(channels.map((c) => c.channel)));

  const kpis: { label: string; value: string; icon: ComponentType<{ className?: string }>; tone: Tone; delta: string }[] = [
    {
      label: "Total Records Ingested",
      value: summary.totalIngests.toLocaleString(),
      icon: Database,
      tone: "accent",
      delta: "all channels, all time",
    },
    {
      label: "Success Rate",
      value: `${summary.successRate}%`,
      icon: Hexagon,
      tone: summary.successRate >= 80 ? "success" : summary.successRate >= 50 ? "warning" : "danger",
      delta: `${summary.doneCount.toLocaleString()} DONE`,
    },
    {
      label: "Pipeline Failures",
      value: summary.failedCount.toLocaleString(),
      icon: AlertTriangle,
      tone: "danger",
      delta: "status = FAILED",
    },
  ];

  return (
    <div
      className="view active relative min-h-full overflow-hidden bg-[color:var(--surface-0)] px-6 pt-10 pb-8 md:px-10 md:pt-14 md:pb-10 xl:px-14 xl:pt-16 xl:pb-12"
      id="v-data-sources"
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
              <span className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-muted)]">
                Live · Data › Ingestion Monitor
              </span>
            </div>
            <h2 className="font-display-tight mt-2 text-[32px] font-semibold text-[color:var(--text-primary)]">
              Data Sources
            </h2>
            <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-[color:var(--text-muted)]">
              Real ingestion volume and channel health, computed from PlaceForge&apos;s
              raw ingest records — no simulated metrics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1.5 border-[color:var(--text-success)]/25 bg-[color:var(--text-success)]/10 py-1 pl-2 pr-2.5 text-[color:var(--text-success)]"
            >
              <Activity className="h-3 w-3" />
              {activeChannels.length} Active Channel{activeChannels.length === 1 ? "" : "s"}
            </Badge>
            <button
              type="button"
              onClick={() => void load()}
              className="glass-surface glass-glow relative inline-flex items-center gap-1.5 rounded-lg border-0 px-3 py-1.5 text-[12px] font-medium text-[color:var(--text-primary)] transition hover:text-[color:var(--text-primary)]"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* KPIs */}
        <motion.section variants={item} className="flex flex-col gap-3">
          <SectionEyebrow label="Stream Health" hint="all time" />
          <motion.div
            variants={container}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
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
                      <div className="font-display mt-4 text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
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
                      <div className="mt-2.5 text-[11px] text-[color:var(--text-muted)]">{k.delta}</div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.section>

        {/* Active sources + per-channel breakdown */}
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
          <motion.div variants={item}>
            <GlassCard>
              <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--surface-2)] ring-1 ring-inset ring-[color:var(--border)]">
                    <Database className="h-4 w-4 text-[color:var(--text-secondary)]" />
                  </div>
                  <CardTitle className="font-display text-[14px] font-semibold text-[color:var(--text-primary)]">
                    Active Sources
                  </CardTitle>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-2.5 py-1 text-[11px] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-3)]"
                >
                  <Plus className="h-3 w-3" />
                  Add source
                </button>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 px-6 pb-6 pt-5">
                {activeChannels.length === 0 ? (
                  <div className="py-8 text-center text-[12px] text-[color:var(--text-muted)]">
                    No active channels configured yet.
                  </div>
                ) : (
                  activeChannels.map((source, i) => (
                    <motion.div
                      key={source.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.1 + i * 0.06, ease: "easeOut" }}
                      className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-1)] px-4 py-3 transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-2)]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--text-success)]" />
                          <span className="truncate text-[12.5px] font-medium text-[color:var(--text-primary)]">
                            {source.channel_name || source.channel_id}
                          </span>
                        </div>
                        <StatusBadge tone="accent">{source.channel}</StatusBadge>
                      </div>
                      <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-[color:var(--text-muted)]">
                        Last message:{" "}
                        {source.last_message_at ? timeAgo(source.last_message_at) : "never"}
                        {source.last_run_status ? ` · last run ${source.last_run_status}` : ""}
                      </div>
                    </motion.div>
                  ))
                )}
              </CardContent>
            </GlassCard>
          </motion.div>

          <motion.div variants={item}>
            <GlassCard className="h-full">
              <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--surface-2)] ring-1 ring-inset ring-[color:var(--border)]">
                    <Waves className="h-4 w-4 text-[color:var(--text-secondary)]" />
                  </div>
                  <CardTitle className="font-display text-[14px] font-semibold text-[color:var(--text-primary)]">
                    Per-Channel Breakdown
                  </CardTitle>
                </div>
                <select
                  value={breakdownChannel}
                  onChange={(e) => setBreakdownChannel(e.target.value)}
                  className="appearance-none rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] py-1.5 pl-3 pr-8 text-[11px] text-[color:var(--text-secondary)] outline-none transition hover:bg-[color:var(--surface-3)] focus:border-[color:var(--orange-400)]/40"
                >
                  {distinctChannelTypes.length === 0 ? <option value="">No channels</option> : null}
                  {distinctChannelTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-5">
                <div className="text-[11.5px] text-[color:var(--text-muted)]">
                  Ingest status counts for {breakdownChannel || "—"} (GET /ingests/stats)
                </div>
                <div className="mt-4 flex flex-col gap-2.5">
                  {breakdownTotal === 0 ? (
                    <div className="py-6 text-center text-[12px] text-[color:var(--text-muted)]">
                      No ingests recorded for this channel yet.
                    </div>
                  ) : (
                    Object.entries(breakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([status, count]) => (
                        <div key={status} className="flex items-center gap-3">
                          <span className="w-24 shrink-0 font-mono text-[10.5px] uppercase tracking-wider text-[color:var(--text-muted)]">
                            {status}
                          </span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[color:var(--surface-2)]">
                            <div
                              className={cn("h-full rounded-full", STATUS_COLORS[status] ?? "bg-[color:var(--orange-400)]")}
                              style={{ width: `${Math.round((count / breakdownTotal) * 100)}%` }}
                            />
                          </div>
                          <span className="w-10 shrink-0 text-right font-mono text-[11px] tabular-nums text-[color:var(--text-secondary)]">
                            {count}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>

      <ChannelFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => void load()}
        editing={null}
      />
    </div>
  );
}
