"use client";

import { useEffect, useRef, type ComponentType } from "react";
import { animate, motion, useInView, type Variants } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Brain,
  ClipboardCheck,
  Copy,
  Flag,
  GitMerge,
  Globe2,
  Layers3,
  Map,
  MapPinOff,
  Minus,
  RefreshCw,
  Sparkles,
  Timer,
  TrendingDown,
  TrendingUp,
  Users,
  Waves,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

const toneRing: Record<Tone, string> = {
  neutral: "ring-white/5",
  accent: "ring-[color:var(--orange-400)]/30",
  success: "ring-[color:var(--text-success)]/25",
  warning: "ring-[color:var(--text-warning)]/25",
  danger: "ring-[color:var(--text-danger)]/30",
};

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

const toneNumber: Record<Tone, string> = {
  neutral: "text-white",
  accent: "text-[color:var(--orange-400)]",
  success: "text-[color:var(--text-success)]",
  warning: "text-[color:var(--text-warning)]",
  danger: "text-[color:var(--text-danger)]",
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

function formatInt(value: number): string {
  return Math.round(value).toLocaleString();
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `${m >= 10 ? m.toFixed(1) : m.toFixed(2)}M`.replace(/\.0+M$/, "M");
  }
  if (value >= 10_000) {
    const k = value / 1_000;
    return `${k.toFixed(1)}K`.replace(/\.0K$/, "K");
  }
  return Math.round(value).toLocaleString();
}

type CountUpProps = {
  to: number;
  format?: (n: number) => string;
  duration?: number;
};

function CountUp({ to, format = formatInt, duration = 1.4 }: CountUpProps) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(nodeRef, { once: true, margin: "0px 0px -10% 0px" });

  useEffect(() => {
    const node = nodeRef.current;
    if (!inView || !node) return;

    const controls = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (value) => {
        node.textContent = format(value);
      },
    });

    return () => controls.stop();
  }, [inView, to, duration, format]);

  return <span ref={nodeRef}>{format(0)}</span>;
}

type Kpi = {
  label: string;
  value: number;
  format?: (n: number) => string;
  delta?: string;
  deltaTone?: Tone;
  icon: ComponentType<{ className?: string }>;
  tone?: Tone;
};

const primaryKpis: Kpi[] = [
  {
    label: "Total Places",
    value: 42_891_034,
    format: formatCompact,
    icon: Map,
    tone: "accent",
    delta: "+12,043 today",
    deltaTone: "success",
  },
  {
    label: "AI Accuracy",
    value: 98.4,
    format: formatPercent,
    icon: Brain,
    tone: "success",
    delta: "Stable · 24h",
    deltaTone: "neutral",
  },
  {
    label: "Human Review Queue",
    value: 1_204,
    icon: Users,
    tone: "danger",
    delta: "Action required",
    deltaTone: "danger",
  },
  {
    label: "Duplicate Candidates",
    value: 3_492,
    icon: Copy,
    tone: "warning",
    delta: "Processing…",
    deltaTone: "neutral",
  },
];

const secondaryKpis: Kpi[] = [
  {
    label: "Ingests Today",
    value: 4_821,
    icon: Waves,
    tone: "accent",
    delta: "+12% vs yesterday",
    deltaTone: "success",
  },
  {
    label: "Success Rate",
    value: 94.1,
    format: formatPercent,
    icon: TrendingUp,
    tone: "success",
    delta: "of 4,821 ingests",
    deltaTone: "neutral",
  },
  {
    label: "Alive Workers",
    value: 7,
    icon: Zap,
    tone: "success",
    delta: "2 draining",
    deltaTone: "warning",
  },
  {
    label: "Dead Letters",
    value: 23,
    icon: AlertTriangle,
    tone: "warning",
    delta: "awaiting replay",
    deltaTone: "neutral",
  },
];

const footerKpis: Kpi[] = [
  {
    label: "Open Flags",
    value: 142,
    icon: Flag,
    tone: "danger",
    delta: "38 critical",
    deltaTone: "danger",
  },
  {
    label: "Pending Deltas",
    value: 287,
    icon: Layers3,
    tone: "neutral",
    delta: "not yet applied",
    deltaTone: "neutral",
  },
  {
    label: "Merges Today",
    value: 14,
    icon: GitMerge,
    tone: "accent",
    delta: "auto + manual",
    deltaTone: "neutral",
  },
  {
    label: "Completeness Rules",
    value: 31,
    icon: ClipboardCheck,
    tone: "success",
    delta: "6 place types",
    deltaTone: "neutral",
  },
];

const trustSegments = [
  { label: "Trusted", pct: 65, color: "#22c55e" },
  { label: "Good", pct: 20, color: "#3b82f6" },
  { label: "Needs Attention", pct: 10, color: "#f59e0b" },
  { label: "Critical", pct: 5, color: "#ef4444" },
];

type Alert = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  detail: string;
  tone: Tone;
};

const alerts: Alert[] = [
  {
    icon: MapPinOff,
    title: "Suspicious Coordinates",
    detail: "Entity GE0-8921 mapped in the ocean.",
    tone: "danger",
  },
  {
    icon: Globe2,
    title: "Country Mismatch",
    detail: "Address indicates FR, coordinates fall in DE.",
    tone: "danger",
  },
  {
    icon: Copy,
    title: "High-Confidence Duplicate",
    detail: "98% match found for “Central Park Cafe”.",
    tone: "warning",
  },
];

type IngestRow = {
  status: string;
  tone: Tone;
  count: number;
  share: number;
};

const ingestRows: IngestRow[] = [
  { status: "DONE", tone: "success", count: 4532, share: 94 },
  { status: "PENDING", tone: "neutral", count: 142, share: 3 },
  { status: "PARSING", tone: "accent", count: 88, share: 2 },
  { status: "DUPLICATE", tone: "warning", count: 41, share: 1 },
  { status: "FAILED", tone: "danger", count: 18, share: 0.4 },
];

type ActivityEntry = {
  status: string;
  tone: Tone;
  when: string;
  detail: string;
};

const activityFeed: ActivityEntry[] = [
  {
    status: "DONE",
    tone: "success",
    when: "2s ago",
    detail: "POI · @addis_poi_reports",
  },
  {
    status: "PARSING",
    tone: "accent",
    when: "12s ago",
    detail: "POI · @addis_poi_reports",
  },
  {
    status: "FAILED",
    tone: "danger",
    when: "1m ago",
    detail: "ROAD · REST_API",
  },
  {
    status: "DUPLICATE",
    tone: "warning",
    when: "3m ago",
    detail: "POI · Telegram Bot",
  },
  {
    status: "DONE",
    tone: "success",
    when: "5m ago",
    detail: "NATURAL · BATCH_IMPORT",
  },
];

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
        fixed && "min-w-[96px] justify-center",
        toneBadgeVariant[tone],
      )}
    >
      {children}
    </Badge>
  );
}

type KpiSize = "sm" | "md" | "lg";

const kpiSizeConfig: Record<
  KpiSize,
  {
    padding: string;
    iconBox: string;
    iconSize: string;
    labelSize: string;
    valueSize: string;
    deltaSize: string;
    trendIconSize: string;
    minHeight: string;
    gapIconToLabel: string;
    gapLabelToValue: string;
    gapValueToDelta: string;
  }
> = {
  sm: {
    padding: "p-5",
    iconBox: "h-10 w-10",
    iconSize: "h-[18px] w-[18px]",
    labelSize: "text-[10.5px] tracking-[0.14em]",
    valueSize: "text-[22px]",
    deltaSize: "text-[10.5px]",
    trendIconSize: "h-3 w-3",
    minHeight: "min-h-[148px]",
    gapIconToLabel: "mt-3.5",
    gapLabelToValue: "mt-1.5",
    gapValueToDelta: "mt-2",
  },
  md: {
    padding: "p-6",
    iconBox: "h-11 w-11",
    iconSize: "h-[19px] w-[19px]",
    labelSize: "text-[11px] tracking-[0.14em]",
    valueSize: "text-[26px]",
    deltaSize: "text-[11px]",
    trendIconSize: "h-3.5 w-3.5",
    minHeight: "min-h-[168px]",
    gapIconToLabel: "mt-4",
    gapLabelToValue: "mt-2",
    gapValueToDelta: "mt-2.5",
  },
  lg: {
    padding: "p-7",
    iconBox: "h-12 w-12",
    iconSize: "h-[22px] w-[22px]",
    labelSize: "text-[11.5px] tracking-[0.15em]",
    valueSize: "text-[30px]",
    deltaSize: "text-[11.5px]",
    trendIconSize: "h-3.5 w-3.5",
    minHeight: "min-h-[190px]",
    gapIconToLabel: "mt-5",
    gapLabelToValue: "mt-2.5",
    gapValueToDelta: "mt-3",
  },
};

function DeltaTrendIcon({
  tone,
  className,
}: {
  tone: Tone;
  className?: string;
}) {
  if (tone === "success" || tone === "accent") {
    return <TrendingUp className={className} />;
  }
  if (tone === "danger") {
    return <TrendingDown className={className} />;
  }
  if (tone === "warning") {
    return <AlertTriangle className={className} />;
  }
  return <Minus className={className} />;
}

function KpiCard({
  kpi,
  accent = false,
  size = "md",
}: {
  kpi: Kpi;
  accent?: boolean;
  size?: KpiSize;
}) {
  const Icon = kpi.icon;
  const tone = kpi.tone ?? "neutral";
  const deltaTone = kpi.deltaTone ?? "neutral";
  const s = kpiSizeConfig[size];

  return (
    <motion.div
      variants={item}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className="relative"
    >
      <Card
        className={cn(
          "glass-glow relative h-full overflow-hidden border-0 py-0 ring-1",
          toneRing[tone],
          accent ? "glass-surface-accent" : "glass-surface",
        )}
      >
        <div
          className={cn(
            "relative flex h-full min-w-0 flex-col items-center justify-center text-center",
            s.padding,
            s.minHeight,
          )}
        >
          {/* icon chip on top, centered */}
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-2xl",
              s.iconBox,
              toneIconWrap[tone],
            )}
          >
            <Icon className={s.iconSize} />
          </div>

          {/* label */}
          <div
            className={cn(
              "font-display max-w-full truncate font-medium uppercase text-white/55",
              s.labelSize,
              s.gapIconToLabel,
            )}
            title={kpi.label}
          >
            {kpi.label}
          </div>

          {/* hero value — display font, tabular, centered */}
          <div
            className={cn(
              "font-display-tight max-w-full truncate font-semibold tabular-nums leading-none",
              s.valueSize,
              s.gapLabelToValue,
              toneNumber[tone],
            )}
          >
            <CountUp to={kpi.value} format={kpi.format} />
          </div>

          {/* delta with trend arrow */}
          {kpi.delta ? (
            <div
              className={cn(
                "flex max-w-full items-center justify-center gap-1.5",
                s.deltaSize,
                s.gapValueToDelta,
              )}
            >
              <DeltaTrendIcon
                tone={deltaTone}
                className={cn(
                  "shrink-0",
                  s.trendIconSize,
                  toneNumber[deltaTone],
                )}
              />
              <span
                className={cn(
                  "min-w-0 truncate font-medium",
                  toneNumber[deltaTone],
                )}
                title={kpi.delta}
              >
                {kpi.delta}
              </span>
            </div>
          ) : null}
        </div>
      </Card>
    </motion.div>
  );
}

export default function OverviewDashboardPage() {
  return (
    <div
      className="view active relative min-h-full overflow-hidden bg-[color:var(--surface-0)] px-6 pt-10 pb-8 md:px-10 md:pt-14 md:pb-10 xl:px-14 xl:pt-16 xl:pb-12"
      id="v-overview"
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
                Live · System Overview
              </span>
            </div>
            <h2 className="font-display-tight mt-2 text-[32px] font-semibold text-white">
              Cartographic Intel Dashboard
            </h2>
            <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/55">
              Real-time geographical data health and AI analysis metrics.
              <span className="ml-1 text-[color:var(--orange-400)]">
                Last sync: just now
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1.5 border-[color:var(--orange-400)]/30 bg-[color:var(--orange-500)]/10 py-1 pl-2 pr-2.5 text-[color:var(--orange-400)]"
            >
              <Sparkles className="h-3 w-3" />
              AI Insights Beta
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

        {/* Primary KPIs — hero row */}
        <motion.section variants={item} className="flex flex-col gap-3">
          <SectionEyebrow label="Primary Metrics" hint="24h rolling" />
          <motion.div
            variants={container}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4"
          >
            {primaryKpis.map((kpi, idx) => (
              <KpiCard
                key={kpi.label}
                kpi={kpi}
                accent={idx === 0}
                size="lg"
              />
            ))}
          </motion.div>
        </motion.section>

        {/* Secondary KPIs */}
        <motion.section variants={item} className="flex flex-col gap-3">
          <SectionEyebrow label="Ingest Pipeline" hint="last 5 minutes" />
          <motion.div
            variants={container}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4"
          >
            {secondaryKpis.map((kpi) => (
              <KpiCard key={kpi.label} kpi={kpi} size="md" />
            ))}
          </motion.div>
        </motion.section>

        {/* Trust Score + Alerts */}
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
          <motion.div variants={item}>
            <Card className="glass-surface glass-glow relative overflow-hidden border-0 py-0">
              <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 ring-1 ring-inset ring-white/10">
                    <Activity className="h-4 w-4 text-white/75" />
                  </div>
                  <CardTitle className="font-display text-[14px] font-semibold text-white/90">
                    Trust Score Distribution
                  </CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className="border-[color:var(--text-success)]/25 bg-[color:var(--text-success)]/10 text-[color:var(--text-success)]"
                >
                  Stable
                </Badge>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-5">
                <div className="shimmer-line flex h-4 overflow-hidden rounded-full ring-1 ring-inset ring-white/10">
                  {trustSegments.map((segment, i) => (
                    <motion.div
                      key={segment.label}
                      initial={{ width: 0 }}
                      animate={{ width: `${segment.pct}%` }}
                      transition={{
                        duration: 1.1,
                        ease: [0.16, 1, 0.3, 1],
                        delay: 0.3 + i * 0.08,
                      }}
                      style={{ background: segment.color }}
                    />
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-4">
                  {trustSegments.map((s) => (
                    <div
                      key={s.label}
                      className="flex min-w-0 items-center gap-2 text-[11.5px] text-white/75"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: s.color }}
                      />
                      <span className="min-w-0 truncate">
                        {s.label}
                        <span className="ml-1 text-white/45">
                          ({s.pct}%)
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="glass-surface-danger glass-glow relative overflow-hidden border-0 py-0">
              <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--text-danger)]/15 text-[color:var(--text-danger)] ring-1 ring-inset ring-[color:var(--text-danger)]/25">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <CardTitle className="font-display text-[14px] font-semibold text-white/90">
                    Live AI Alerts
                  </CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className="border-[color:var(--text-danger)]/30 bg-[color:var(--text-danger)]/15 font-mono text-[10px] tracking-wider text-[color:var(--text-danger)]"
                >
                  3 CRITICAL
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-3.5 px-6 pb-6 pt-5">
                {alerts.map((alert, i) => {
                  const Icon = alert.icon;
                  return (
                    <motion.div
                      key={alert.title}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.35,
                        delay: 0.3 + i * 0.08,
                        ease: "easeOut",
                      }}
                      whileHover={{ x: 2 }}
                      className="group flex min-w-0 items-start gap-3.5 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 transition hover:border-white/10 hover:bg-white/[0.04]"
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                          toneIconWrap[alert.tone],
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 truncate text-[12.5px] font-medium text-white/90">
                            {alert.title}
                          </div>
                          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-70" />
                        </div>
                        <div className="mt-1 truncate text-[11.5px] text-white/55">
                          {alert.detail}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Ingest breakdown + Activity feed */}
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
          <motion.div variants={item}>
            <Card className="glass-surface glass-glow relative overflow-hidden border-0 py-0">
              <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 ring-1 ring-inset ring-white/10">
                    <Waves className="h-4 w-4 text-white/75" />
                  </div>
                  <CardTitle className="font-display text-[14px] font-semibold text-white/90">
                    Ingest Status Breakdown
                  </CardTitle>
                </div>
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-white/45">
                  5m window
                </span>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-5">
                <div className="flex flex-col gap-3.5">
                  {ingestRows.map((row, i) => (
                    <motion.div
                      key={row.status}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.35,
                        delay: 0.25 + i * 0.06,
                        ease: "easeOut",
                      }}
                      className="grid grid-cols-[104px_72px_1fr] items-center gap-4"
                    >
                      <StatusBadge tone={row.tone} fixed>
                        {row.status}
                      </StatusBadge>
                      <span className="font-mono text-[12.5px] text-white/85 tabular-nums">
                        {row.count.toLocaleString()}
                      </span>
                      <div className="relative">
                        <Progress
                          value={Math.max(row.share, 1)}
                          className={cn(
                            "h-2 bg-white/5",
                            row.tone === "success"
                              ? "[&>[data-slot=progress-indicator]]:bg-[color:var(--text-success)]"
                              : row.tone === "warning"
                                ? "[&>[data-slot=progress-indicator]]:bg-[color:var(--text-warning)]"
                                : row.tone === "danger"
                                  ? "[&>[data-slot=progress-indicator]]:bg-[color:var(--text-danger)]"
                                  : row.tone === "accent"
                                    ? "[&>[data-slot=progress-indicator]]:bg-[color:var(--orange-400)]"
                                    : "[&>[data-slot=progress-indicator]]:bg-white/45",
                          )}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="glass-surface glass-glow relative overflow-hidden border-0 py-0">
              <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 ring-1 ring-inset ring-white/10">
                    <Timer className="h-4 w-4 text-white/75" />
                  </div>
                  <CardTitle className="font-display text-[14px] font-semibold text-white/90">
                    System Activity
                  </CardTitle>
                </div>
                <span className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-white/55">
                  <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--text-success)]" />
                  Streaming
                </span>
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5 px-6 pb-6 pt-5">
                {activityFeed.map((entry, i) => (
                  <motion.div
                    key={`${entry.status}-${entry.when}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.32,
                      delay: 0.25 + i * 0.07,
                      ease: "easeOut",
                    }}
                    className="grid grid-cols-[104px_64px_1fr] items-center gap-3.5 rounded-md px-3 py-2.5 transition hover:bg-white/[0.03]"
                  >
                    <StatusBadge tone={entry.tone} fixed>
                      {entry.status}
                    </StatusBadge>
                    <span className="font-mono text-[10.5px] uppercase text-white/45">
                      {entry.when}
                    </span>
                    <span className="truncate text-[12.5px] text-white/75">
                      {entry.detail}
                    </span>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Footer KPIs */}
        <motion.section variants={item} className="flex flex-col gap-3">
          <SectionEyebrow label="Quality Signals" hint="pending action" />
          <motion.div
            variants={container}
            className="grid grid-cols-2 gap-6 xl:grid-cols-4"
          >
            {footerKpis.map((kpi) => (
              <KpiCard key={kpi.label} kpi={kpi} size="sm" />
            ))}
          </motion.div>
        </motion.section>
      </motion.div>
    </div>
  );
}

function SectionEyebrow({
  label,
  hint,
}: {
  label: string;
  hint?: string;
}) {
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
