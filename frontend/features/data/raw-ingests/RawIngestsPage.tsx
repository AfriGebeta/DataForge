"use client";

import { type ComponentType } from "react";
import { motion, type Variants } from "framer-motion";
import {
  AlertTriangle,

  CheckCircle2,
  Copy,
  Edit3,
  Inbox,
  Plus,
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
import { GlassCard } from "@/features/shared/GlassCard";
import { cn } from "@/lib/utils";

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

function FilterSelect({
  label,
  options,
}: {
  label: string;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        className="appearance-none rounded-lg border border-white/10 bg-white/[0.04] py-1.5 pl-3 pr-8 text-[11.5px] text-white/80 outline-none transition hover:bg-white/[0.07] focus:border-[color:var(--orange-400)]/40"
      >
        <option value="">{label}</option>
        {options.map((opt) => (
          <option key={opt}>{opt}</option>
        ))}
      </select>

    </div>
  );
}

type Kpi = {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  tone: Tone;
  delta: string;
};

const kpis: Kpi[] = [
  {
    label: "Ingests Today",
    value: "4,821",
    icon: Waves,
    tone: "accent",
    delta: "+12% vs yesterday",
  },
  {
    label: "Completed",
    value: "4,532",
    icon: CheckCircle2,
    tone: "success",
    delta: "94% success rate",
  },
  {
    label: "Duplicates",
    value: "41",
    icon: Copy,
    tone: "warning",
    delta: "auto-flagged",
  },
  {
    label: "Failed",
    value: "18",
    icon: AlertTriangle,
    tone: "danger",
    delta: "2 near DLQ",
  },
];

type IngestRow = {
  id: string;
  channel: string;
  type: string;
  status: string;
  statusTone: Tone;
  received: string;
  retries: number;
  actions: ("skip" | "retry" | "dlq")[];
};

const ingestRows: IngestRow[] = [
  {
    id: "a4e2…91f0",
    channel: "TELEGRAM_BOT",
    type: "POI",
    status: "DONE",
    statusTone: "success",
    received: "3s ago",
    retries: 0,
    actions: ["skip"],
  },
  {
    id: "b7c1…33a2",
    channel: "TELEGRAM_BOT",
    type: "POI",
    status: "PARSING",
    statusTone: "accent",
    received: "12s ago",
    retries: 0,
    actions: ["retry"],
  },
  {
    id: "c9d4…77b8",
    channel: "REST_API",
    type: "ROAD",
    status: "FAILED",
    statusTone: "danger",
    received: "1m ago",
    retries: 2,
    actions: ["retry", "dlq"],
  },
  {
    id: "d0e5…12c3",
    channel: "TELEGRAM_BOT",
    type: "POI",
    status: "DUPLICATE",
    statusTone: "warning",
    received: "3m ago",
    retries: 0,
    actions: ["skip"],
  },
  {
    id: "e1f6…45d4",
    channel: "BATCH_IMPORT",
    type: "NATURAL",
    status: "DONE",
    statusTone: "success",
    received: "8h ago",
    retries: 0,
    actions: ["skip"],
  },
];

function RowAction({
  kind,
}: {
  kind: "skip" | "retry" | "dlq";
}) {
  if (kind === "retry") {
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10.5px] font-medium text-white/75 transition hover:bg-white/[0.08] hover:text-white"
      >
        <RotateCcw className="h-3 w-3" />
        Retry
      </button>
    );
  }
  if (kind === "dlq") {
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-md border border-[color:var(--text-danger)]/30 bg-[color:var(--text-danger)]/12 px-2 py-1 text-[10.5px] font-medium text-[color:var(--text-danger)] transition hover:bg-[color:var(--text-danger)]/20"
      >
        → DLQ
      </button>
    );
  }
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10.5px] font-medium text-white/60 transition hover:bg-white/[0.08] hover:text-white/85"
    >
      <SkipForward className="h-3 w-3" />
      Skip
    </button>
  );
}

export default function RawIngestsPage() {
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
                4,821 processed today
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-open="m-bulk"
              className="glass-surface glass-glow relative inline-flex items-center gap-1.5 rounded-lg border-0 px-3 py-1.5 text-[12px] font-medium text-white/85 transition hover:text-white"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Bulk update
            </button>
            <button
              type="button"
              data-open="m-ingest"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--orange-400)]/30 bg-[color:var(--orange-500)]/12 px-3 py-1.5 text-[12px] font-medium text-[color:var(--orange-400)] transition hover:bg-[color:var(--orange-500)]/20"
            >
              <Plus className="h-3.5 w-3.5" />
              Submit ingest
            </button>
          </div>
        </motion.div>

        {/* KPIs */}
        <motion.section variants={item} className="flex flex-col gap-3">
          <SectionEyebrow label="Pipeline Snapshot" hint="last 24h" />
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
                <FilterSelect
                  label="All statuses"
                  options={[
                    "PENDING",
                    "PARSING",
                    "GEO_RESOLVING",
                    "DONE",
                    "FAILED",
                    "DUPLICATE",
                    "SKIPPED",
                  ]}
                />
                <FilterSelect
                  label="All channels"
                  options={["TELEGRAM_BOT", "REST_API", "BATCH_IMPORT"]}
                />
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-5">
              <div className="overflow-x-auto rounded-lg ring-1 ring-inset ring-white/10">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="bg-white/[0.02] text-[10px] uppercase tracking-[0.14em] text-white/45">
                      <th className="px-5 py-3.5 font-medium">ID</th>
                      <th className="px-5 py-3.5 font-medium">Channel</th>
                      <th className="px-5 py-3.5 font-medium">Type</th>
                      <th className="px-5 py-3.5 font-medium">Status</th>
                      <th className="px-5 py-3.5 font-medium">Received</th>
                      <th className="px-5 py-3.5 font-medium">Retries</th>
                      <th className="px-5 py-3.5 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingestRows.map((row, i) => (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.32,
                          delay: 0.25 + i * 0.06,
                          ease: "easeOut",
                        }}
                        className={cn(
                          "border-t border-white/[0.06] transition hover:bg-white/[0.03]",
                          row.statusTone === "danger" &&
                            "bg-[color:var(--text-danger)]/[0.04]",
                        )}
                      >
                        <td className="px-5 py-3.5 font-mono text-[11px] text-white/70">
                          {row.id}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge tone="accent">{row.channel}</StatusBadge>
                        </td>
                        <td className="px-5 py-3.5 text-[11.5px] text-white/75">
                          {row.type}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge tone={row.statusTone} fixed>
                            {row.status}
                          </StatusBadge>
                        </td>
                        <td className="px-5 py-3.5 text-[11.5px] text-white/55">
                          {row.received}
                        </td>
                        <td
                          className={cn(
                            "px-5 py-3.5 font-mono text-[11.5px] tabular-nums",
                            row.retries > 0
                              ? "text-[color:var(--text-warning)]"
                              : "text-white/55",
                          )}
                        >
                          {row.retries}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            {row.actions.map((action) => (
                              <RowAction key={action} kind={action} />
                            ))}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
