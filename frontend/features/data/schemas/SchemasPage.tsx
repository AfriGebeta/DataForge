"use client";

import { type ComponentType } from "react";
import { motion, type Variants } from "framer-motion";
import {
  FileCode2,
  FileCheck2,
  FileClock,
  Layers3,
  Plus,
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
        fixed && "min-w-[80px] justify-center",
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

type Kpi = {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  tone: Tone;
  delta: string;
};

const kpis: Kpi[] = [
  {
    label: "Total Schemas",
    value: "3",
    icon: Layers3,
    tone: "accent",
    delta: "2 place types covered",
  },
  {
    label: "Active",
    value: "2",
    icon: FileCheck2,
    tone: "success",
    delta: "validating live traffic",
  },
  {
    label: "Drafts",
    value: "1",
    icon: FileClock,
    tone: "warning",
    delta: "awaiting publication",
  },
];

type SchemaRow = {
  name: string;
  version: number;
  status: string;
  statusTone: Tone;
  usedBy: string;
};

const schemaRows: SchemaRow[] = [
  {
    name: "poi-v1",
    version: 1,
    status: "Active",
    statusTone: "success",
    usedBy: "@addis_poi_reports, REST ingest",
  },
  {
    name: "real-estate-v1",
    version: 1,
    status: "Active",
    statusTone: "success",
    usedBy: "@addis_real_estate",
  },
  {
    name: "poi-v2",
    version: 2,
    status: "Draft",
    statusTone: "warning",
    usedBy: "—",
  },
];

export default function SchemasPage() {
  return (
    <div
      className="view active relative min-h-full overflow-hidden bg-[color:var(--surface-0)] px-6 pt-10 pb-8 md:px-10 md:pt-14 md:pb-10 xl:px-14 xl:pt-16 xl:pb-12"
      id="v-schemas"
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
                Live · Data › Validation
              </span>
            </div>
            <h2 className="font-display-tight mt-2 text-[32px] font-semibold text-white">
              Worker Schemas
            </h2>
            <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/55">
              Validation schemas for worker-processed data outputs.
              <span className="ml-1 text-[color:var(--orange-400)]">
                2 active · 1 draft
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-open="m-schema"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--orange-400)]/30 bg-[color:var(--orange-500)]/12 px-3 py-1.5 text-[12px] font-medium text-[color:var(--orange-400)] transition hover:bg-[color:var(--orange-500)]/20"
            >
              <Plus className="h-3.5 w-3.5" />
              Create schema
            </button>
          </div>
        </motion.div>

        {/* KPIs */}
        <motion.section variants={item} className="flex flex-col gap-3">
          <SectionEyebrow label="Schema Registry" hint="current state" />
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

        {/* Schema table */}
        <motion.div variants={item}>
          <GlassCard>
            <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 ring-1 ring-inset ring-white/10">
                  <FileCode2 className="h-4 w-4 text-white/75" />
                </div>
                <CardTitle className="font-display text-[14px] font-semibold text-white/90">
                  Registered Schemas
                </CardTitle>
              </div>
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-white/45">
                versioned
              </span>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-5">
              <div className="overflow-x-auto rounded-lg ring-1 ring-inset ring-white/10">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="bg-white/[0.02] text-[10px] uppercase tracking-[0.14em] text-white/45">
                      <th className="px-5 py-3.5 font-medium">Name</th>
                      <th className="px-5 py-3.5 font-medium">Version</th>
                      <th className="px-5 py-3.5 font-medium">Status</th>
                      <th className="px-5 py-3.5 font-medium">
                        Used by channels
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {schemaRows.map((row, i) => (
                      <motion.tr
                        key={row.name}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.32,
                          delay: 0.25 + i * 0.06,
                          ease: "easeOut",
                        }}
                        className="border-t border-white/[0.06] transition hover:bg-white/[0.03]"
                      >
                        <td className="px-5 py-3.5 font-mono text-[11.5px] font-medium text-white/90">
                          {row.name}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[11.5px] tabular-nums text-white/70">
                          v{row.version}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge tone={row.statusTone} fixed>
                            {row.status}
                          </StatusBadge>
                        </td>
                        <td className="px-5 py-3.5 text-[11.5px] text-white/65">
                          {row.usedBy}
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
