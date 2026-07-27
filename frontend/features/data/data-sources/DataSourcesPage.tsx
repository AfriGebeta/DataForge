"use client";

import { type ComponentType } from "react";
import { motion, type Variants } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Database,
  Hexagon,
  Plus,
  RefreshCw,
  TrendingUp,
  Waves,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GlassCard } from "@/features/shared/GlassCard";
import { Progress } from "@/components/ui/progress";
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
  deltaTone?: Tone;
};

const kpis: Kpi[] = [
  {
    label: "Records Ingested (24h)",
    value: "1.4M",
    icon: Database,
    tone: "accent",
    delta: "+12% vs yesterday",
    deltaTone: "success",
  },
  {
    label: "Global Health Score",
    value: "94",
    icon: Hexagon,
    tone: "success",
    delta: "aggregate trust across nodes",
  },
  {
    label: "Pipeline Failures",
    value: "23",
    icon: AlertTriangle,
    tone: "danger",
    delta: "drops in last 24h",
    deltaTone: "danger",
  },
];

type Source = {
  name: string;
  trust: number;
  tone: Tone;
  lastPayload: string;
  status: string;
};

const sources: Source[] = [
  {
    name: "Traffic APP",
    trust: 99,
    tone: "success",
    lastPayload: "5 sec ago",
    status: "99% Trust",
  },
  {
    name: "OpenStreetMap",
    trust: 91,
    tone: "success",
    lastPayload: "12 sec ago",
    status: "91% Trust",
  },
  {
    name: "Data Horde",
    trust: 94,
    tone: "success",
    lastPayload: "2 min ago",
    status: "94% Trust",
  },
  {
    name: "Gov GIS Fed.",
    trust: 98,
    tone: "success",
    lastPayload: "1 hr ago",
    status: "98% Trust",
  },
  {
    name: "Fleet Telematics Alpha",
    trust: 64,
    tone: "danger",
    lastPayload: "4 hrs ago",
    status: "64% Degraded",
  },
];

const chartDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function DataSourcesPage() {
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
              <span className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
                Live · Data › Ingestion Monitor
              </span>
            </div>
            <h2 className="font-display-tight mt-2 text-[32px] font-semibold text-white">
              Data Sources
            </h2>
            <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/55">
              Real-time status of external cartographic data streams and
              reliability metrics.
              <span className="ml-1 text-[color:var(--orange-400)]">
                Last sync: 2m ago
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1.5 border-[color:var(--text-success)]/25 bg-[color:var(--text-success)]/10 py-1 pl-2 pr-2.5 text-[color:var(--text-success)]"
            >
              <Activity className="h-3 w-3" />5 Active Streams
            </Badge>
            <button
              type="button"
              className="glass-surface glass-glow relative inline-flex items-center gap-1.5 rounded-lg border-0 px-3 py-1.5 text-[12px] font-medium text-white/85 transition hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* KPIs */}
        <motion.section variants={item} className="flex flex-col gap-3">
          <SectionEyebrow label="Stream Health" hint="24h rolling" />
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
                      <div
                        className={cn(
                          "mt-2.5 text-[11px]",
                          k.deltaTone ? toneText[k.deltaTone] : "text-white/55",
                        )}
                      >
                        {k.delta}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.section>

        {/* Active sources + Health chart */}
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
          <motion.div variants={item}>
            <GlassCard>
              <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 ring-1 ring-inset ring-white/10">
                    <Waves className="h-4 w-4 text-white/75" />
                  </div>
                  <CardTitle className="font-display text-[14px] font-semibold text-white/90">
                    Active Sources
                  </CardTitle>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/75 transition hover:bg-white/[0.06]"
                >
                  <Plus className="h-3 w-3" />
                  Add source
                </button>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 px-6 pb-6 pt-5">
                {sources.map((source, i) => (
                  <motion.div
                    key={source.name}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: 0.25 + i * 0.06,
                      ease: "easeOut",
                    }}
                    whileHover={{ x: 2 }}
                    className={cn(
                      "rounded-lg border px-4 py-3 transition",
                      source.tone === "danger"
                        ? "border-[color:var(--text-danger)]/25 bg-[color:var(--text-danger)]/[0.05] hover:border-[color:var(--text-danger)]/40"
                        : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={cn(
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            source.tone === "danger"
                              ? "bg-[color:var(--text-danger)] pulse-dot"
                              : "bg-[color:var(--text-success)]",
                          )}
                        />
                        <span className="truncate text-[12.5px] font-medium text-white/90">
                          {source.name}
                        </span>
                      </div>
                      <StatusBadge tone={source.tone}>
                        {source.status}
                      </StatusBadge>
                    </div>
                    <Progress
                      value={source.trust}
                      className={cn(
                        "mt-2.5 h-1.5 bg-white/5",
                        source.tone === "danger"
                          ? "[&>[data-slot=progress-indicator]]:bg-[color:var(--text-danger)]"
                          : "[&>[data-slot=progress-indicator]]:bg-[color:var(--text-success)]",
                      )}
                    />
                    <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-white/40">
                      Last payload: {source.lastPayload}
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </GlassCard>
          </motion.div>

          <motion.div variants={item}>
            <GlassCard className="h-full">
              <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 ring-1 ring-inset ring-white/10">
                    <TrendingUp className="h-4 w-4 text-white/75" />
                  </div>
                  <CardTitle className="font-display text-[14px] font-semibold text-white/90">
                    Source Health Over Time
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  {["24H", "7D", "30D"].map((range) => (
                    <button
                      key={range}
                      type="button"
                      className={cn(
                        "rounded-md border px-2.5 py-1 font-mono text-[10px] tracking-wider transition",
                        range === "7D"
                          ? "border-[color:var(--orange-400)]/30 bg-[color:var(--orange-500)]/15 text-[color:var(--orange-400)]"
                          : "border-white/10 bg-white/[0.03] text-white/55 hover:bg-white/[0.06] hover:text-white/80",
                      )}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-5">
                <div className="text-[11.5px] text-white/55">
                  Quality degradation analysis (7-day window)
                </div>
                <div className="relative mt-4 overflow-hidden rounded-lg border border-white/10 bg-white/[0.02] px-4 pb-8 pt-4">
                  <span className="absolute left-3 top-3 font-mono text-[9.5px] text-white/40">
                    100%
                  </span>
                  <span className="absolute bottom-7 left-3 font-mono text-[9.5px] text-white/40">
                    0%
                  </span>
                  <svg
                    viewBox="0 0 300 140"
                    className="h-[180px] w-full overflow-visible"
                    preserveAspectRatio="none"
                  >
                    <motion.polyline
                      points="0,10 50,12 100,8 150,11 200,9 250,7 300,5"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{
                        duration: 1.2,
                        ease: [0.16, 1, 0.3, 1],
                        delay: 0.4,
                      }}
                    />
                    <motion.polyline
                      points="0,50 50,60 100,75 150,80 200,90 250,105 300,120"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                      strokeDasharray="5 3"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{
                        duration: 1.2,
                        ease: [0.16, 1, 0.3, 1],
                        delay: 0.55,
                      }}
                    />
                  </svg>
                  <div className="mt-2 flex justify-between px-1">
                    {chartDays.map((day) => (
                      <span
                        key={day}
                        className="font-mono text-[9.5px] uppercase text-white/40"
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-5">
                  <span className="flex items-center gap-2 text-[11px] text-white/75">
                    <span className="inline-block h-0.5 w-4 bg-[#3b82f6]" />
                    Gov GIS Fed.
                  </span>
                  <span className="flex items-center gap-2 text-[11px] text-white/75">
                    <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-[#ef4444]" />
                    Fleet Telematics
                  </span>
                </div>
              </CardContent>
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
