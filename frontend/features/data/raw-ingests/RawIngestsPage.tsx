"use client";

import { type ComponentType, useState, useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import DataTable, { type ColumnDef } from "@/components/ui/DataTable";
import { fetchRawIngests } from "./api";
import type { RawIngestItem } from "./types";
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
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={onChange}
        className="appearance-none rounded-lg border border-white/10 bg-white/[0.04] py-1.5 pl-3 pr-8 text-[11.5px] text-white/80 outline-none transition hover:bg-white/[0.07] focus:border-[color:var(--orange-400)]/40"
      >
        <option value="">{label}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
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

const columns: ColumnDef<RawIngestItem>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => {
      const id = row.getValue<string>("id") || "";
      return <span className="font-mono text-[11px] text-white/70">{id.substring(0, 8)}...</span>;
    },
  },
  {
    accessorKey: "channel",
    header: "Channel",
    cell: ({ row }) => (
      <StatusBadge tone="accent">{row.getValue<string>("channel")}</StatusBadge>
    ),
  },
  {
    accessorKey: "source_type",
    header: "Type",
    cell: ({ row }) => (
      <span className="text-[11.5px] text-white/75">{row.getValue<string>("source_type")}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue<string>("status") || "";
      let tone: Tone = "neutral";
      if (status === "DONE" || status === "SUCCESS") tone = "success";
      if (status === "FAILED" || status === "ERROR") tone = "danger";
      if (status === "DUPLICATE" || status === "WARNING") tone = "warning";
      if (status === "PARSING" || status === "GEO_RESOLVING" || status === "PENDING") tone = "accent";

      return (
        <StatusBadge tone={tone} fixed>
          {status}
        </StatusBadge>
      );
    },
  },
  {
    accessorKey: "received_at",
    header: "Received",
    cell: ({ row }) => {
      const dateStr = row.getValue<string>("received_at");
      const formatted = dateStr ? new Date(dateStr).toLocaleString() : "Unknown";
      return <span className="text-[11.5px] text-white/55">{formatted}</span>;
    },
  },
  {
    accessorKey: "retry_count",
    header: "Retries",
    cell: ({ row }) => {
      const retries = row.getValue<number>("retry_count") || 0;
      return (
        <span className={cn("font-mono text-[11.5px] tabular-nums", retries > 0 ? "text-[color:var(--text-warning)]" : "text-white/55")}>
          {retries}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const status = row.getValue<string>("status") || "";
      const actions: ("skip" | "retry" | "dlq")[] = [];
      if (status === "FAILED") actions.push("retry", "dlq");
      else if (status !== "DONE" && status !== "SUCCESS") actions.push("skip");

      return (
        <div className="flex items-center gap-1.5">
          {actions.map((action) => (
            <RowAction key={action} kind={action} />
          ))}
        </div>
      );
    },
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
  const [data, setData] = useState<RawIngestItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const response = await fetchRawIngests({
          status: statusFilter || undefined,
          channel: channelFilter || undefined,
        });
        setData(response.items || []);
      } catch (error) {
        console.error("Error fetching ingests", error);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [statusFilter, channelFilter]);

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
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
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
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                  options={["TELEGRAM_BOT", "REST_API", "BATCH_IMPORT"]}
                />
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-5">
              <DataTable
                columns={columns}
                data={data}
                loading={isLoading}
              />
            </CardContent>
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
