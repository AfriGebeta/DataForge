"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { animate, motion, useInView, type Variants } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Brain,
  ClipboardCheck,
  Copy,
  Flag,
  GitMerge,
  History,
  Layers3,
  Map,
  MapPinOff,
  Minus,
  RefreshCw,
  Sparkles,
  Tag,
  Timer,
  TrendingDown,
  TrendingUp,
  Users,
  Waves,
  Zap,
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
import { fetchOverviewDashboard } from "./api";
import type { DashboardResponse } from "./types";

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

const toneNumber: Record<Tone, string> = {
  neutral: "text-[color:var(--text-primary)]",
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
  /** When set, the card becomes clickable — used to drill into the filtered list that explains the number. */
  onClick?: () => void;
};

// ── Builders: real DashboardResponse -> the view models above ───────────
// Every number below traces back to a field in DashboardResponse (see
// types.ts / PlaceForge's overview module) — nothing here is fabricated.

function buildPrimaryKpis(d: DashboardResponse): Kpi[] {
  return [
    {
      label: "Total Places",
      value: d.total_places,
      format: formatCompact,
      icon: Map,
      tone: "accent",
    },
    {
      label: "AI Accuracy",
      value: d.ai_accuracy,
      format: formatPercent,
      icon: Brain,
      tone: d.ai_accuracy >= 80 ? "success" : d.ai_accuracy >= 50 ? "warning" : "danger",
      delta: "mean parsed-entity confidence",
      deltaTone: "neutral",
    },
    {
      label: "Human Review Queue",
      value: d.human_review_queue,
      icon: Users,
      tone: d.human_review_queue > 0 ? "danger" : "success",
      delta: d.human_review_queue > 0 ? "Action required" : "All clear",
      deltaTone: d.human_review_queue > 0 ? "danger" : "success",
    },
    {
      label: "Duplicate Candidates",
      value: d.duplicate_candidates,
      icon: Copy,
      tone: d.duplicate_candidates > 0 ? "warning" : "success",
      delta: "pending merge review",
      deltaTone: "neutral",
    },
  ];
}

// "Unfinished places" — every reason a place can be incomplete and need an
// operator's attention, each clicking through to Place List pre-filtered to
// just that reason. Kept as its own strip (not folded into Primary Metrics)
// since these are data-completeness signals, not top-line pipeline health.
function buildCompletenessKpis(
  d: DashboardResponse,
  onMissingCategoryClick: () => void,
  onMissingCoordinatesClick: () => void,
  onNeedingRefreshClick: () => void,
): Kpi[] {
  return [
    {
      label: "Missing Category",
      value: d.places_missing_category,
      icon: Tag,
      tone: d.places_missing_category > 0 ? "danger" : "success",
      delta: d.places_missing_category > 0 ? "Click to fix" : "All places categorized",
      deltaTone: d.places_missing_category > 0 ? "danger" : "success",
      onClick: onMissingCategoryClick,
    },
    {
      label: "Missing Coordinates",
      value: d.places_missing_coordinates,
      icon: MapPinOff,
      tone: d.places_missing_coordinates > 0 ? "danger" : "success",
      delta: d.places_missing_coordinates > 0 ? "Never geocoded — click to fix" : "All places geocoded",
      deltaTone: d.places_missing_coordinates > 0 ? "danger" : "success",
      onClick: onMissingCoordinatesClick,
    },
    {
      label: "Needing Refresh",
      value: d.places_needing_refresh,
      icon: History,
      tone: d.places_needing_refresh > 0 ? "warning" : "success",
      delta: d.places_needing_refresh > 0 ? "Outdated — click to review" : "All places up to date",
      deltaTone: d.places_needing_refresh > 0 ? "warning" : "success",
      onClick: onNeedingRefreshClick,
    },
  ];
}

function buildSecondaryKpis(d: DashboardResponse): Kpi[] {
  return [
    {
      label: "Ingests Today",
      value: d.ingests_today,
      icon: Waves,
      tone: "accent",
    },
    {
      label: "Success Rate",
      value: d.success_rate,
      format: formatPercent,
      icon: TrendingUp,
      tone: d.success_rate >= 80 ? "success" : "warning",
      delta: "of today's ingest pipeline",
      deltaTone: "neutral",
    },
    {
      label: "Alive Workers",
      value: d.alive_workers,
      icon: Zap,
      tone: d.alive_workers > 0 ? "success" : "danger",
      delta: `${d.draining_workers} draining`,
      deltaTone: d.draining_workers > 0 ? "warning" : "neutral",
    },
    {
      label: "Dead Letters",
      value: d.dead_letters,
      icon: AlertTriangle,
      tone: d.dead_letters > 0 ? "warning" : "success",
      delta: "awaiting replay",
      deltaTone: "neutral",
    },
  ];
}

function buildFooterKpis(d: DashboardResponse): Kpi[] {
  return [
    {
      label: "Open Flags",
      value: d.open_flags,
      icon: Flag,
      tone: d.critical_flags > 0 ? "danger" : d.open_flags > 0 ? "warning" : "success",
      delta: `${d.critical_flags} critical`,
      deltaTone: d.critical_flags > 0 ? "danger" : "neutral",
    },
    {
      label: "Pending Deltas",
      value: d.pending_deltas,
      icon: Layers3,
      tone: "neutral",
      delta: "not yet applied",
      deltaTone: "neutral",
    },
    {
      label: "Merges Today",
      value: d.merges_today,
      icon: GitMerge,
      tone: "accent",
      delta: "applied today",
      deltaTone: "neutral",
    },
    {
      label: "Completeness Rules",
      value: d.completeness_rules_count,
      icon: ClipboardCheck,
      tone: "success",
    },
  ];
}

const completenessOrder = ["COMPLETE", "GOOD", "PARTIAL", "MINIMAL"] as const;
const completenessMeta: Record<(typeof completenessOrder)[number], { label: string; color: string }> = {
  COMPLETE: { label: "Complete", color: "#22c55e" },
  GOOD: { label: "Good", color: "#3b82f6" },
  PARTIAL: { label: "Partial", color: "#f59e0b" },
  MINIMAL: { label: "Minimal", color: "#ef4444" },
};

function buildTrustSegments(d: DashboardResponse) {
  const total = Object.values(d.trust_distribution).reduce((a, b) => a + b, 0);
  return completenessOrder
    .map((level) => {
      const count = d.trust_distribution[level] ?? 0;
      return {
        label: completenessMeta[level].label,
        pct: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
        color: completenessMeta[level].color,
      };
    })
    .filter((s) => s.pct > 0 || total === 0);
}

function severityTone(severity: string): Tone {
  if (severity === "CRITICAL" || severity === "ERROR") return "danger";
  if (severity === "WARNING") return "warning";
  return "neutral";
}

function statusTone(status: string): Tone {
  if (status === "DONE") return "success";
  if (status === "FAILED") return "danger";
  if (status === "DUPLICATE" || status === "SKIPPED") return "warning";
  return "accent";
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

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

const kpiValueSize: Record<KpiSize, string> = {
  sm: "text-[19px]",
  md: "text-[23px]",
  lg: "text-[28px]",
};

const kpiPadding: Record<KpiSize, string> = {
  sm: "p-4",
  md: "p-5",
  lg: "p-5",
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

/**
 * One column inside a KpiStrip: small inline icon + label on top, the number
 * as the only large element, delta underneath. No icon tile, no card
 * chrome of its own — the strip supplies that once for the whole row.
 */
function KpiStat({
  kpi,
  size = "md",
  emphasize = false,
}: {
  kpi: Kpi;
  size?: KpiSize;
  emphasize?: boolean;
}) {
  const Icon = kpi.icon;
  const tone = kpi.tone ?? "neutral";
  const deltaTone = kpi.deltaTone ?? "neutral";

  const className = cn(
    "flex min-w-0 flex-col text-left transition-colors",
    kpiPadding[size],
    kpi.onClick && "cursor-pointer hover:bg-[color:var(--surface-1)]",
    emphasize && "bg-[color:var(--bg-accent)]",
  );

  const content = (
    <>
      <div className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.1em] text-[color:var(--text-muted)]">
        <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
        <span className="truncate" title={kpi.label}>
          {kpi.label}
        </span>
      </div>

      <div
        className={cn(
          "font-display-tight mt-2 truncate font-semibold tabular-nums leading-none",
          kpiValueSize[emphasize ? "lg" : size],
          toneNumber[tone],
        )}
      >
        <CountUp to={kpi.value} format={kpi.format} />
      </div>

      {kpi.delta ? (
        <div className="mt-2 flex min-w-0 items-center gap-1.5 text-[11px]">
          <DeltaTrendIcon
            tone={deltaTone}
            className={cn("h-3 w-3 shrink-0", toneNumber[deltaTone])}
          />
          <span
            className={cn("min-w-0 truncate font-medium", toneNumber[deltaTone])}
            title={kpi.delta}
          >
            {kpi.delta}
          </span>
        </div>
      ) : null}
    </>
  );

  if (kpi.onClick) {
    return (
      <button type="button" onClick={kpi.onClick} className={className}>
        {content}
      </button>
    );
  }
  return <div className={className}>{content}</div>;
}

/** A row of KpiStats sharing one card surface, divided by hairlines — the
 *  data-dense alternative to N identical icon-tile cards. */
function KpiStrip({
  kpis,
  gridClass,
  size = "md",
  emphasizeFirst = false,
}: {
  kpis: Kpi[];
  gridClass: string;
  size?: KpiSize;
  emphasizeFirst?: boolean;
}) {
  return (
    <motion.div variants={item}>
      <GlassCard>
        <div
          className={cn(
            "grid divide-y divide-[color:var(--border)] sm:divide-y-0 sm:divide-x",
            gridClass,
          )}
        >
          {kpis.map((kpi, idx) => (
            <KpiStat
              key={kpi.label}
              kpi={kpi}
              size={size}
              emphasize={emphasizeFirst && idx === 0}
            />
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}

const emptyDashboard: DashboardResponse = {
  total_places: 0,
  ai_accuracy: 0,
  human_review_queue: 0,
  duplicate_candidates: 0,
  places_missing_category: 0,
  places_missing_coordinates: 0,
  places_needing_refresh: 0,
  ingests_today: 0,
  success_rate: 0,
  alive_workers: 0,
  draining_workers: 0,
  dead_letters: 0,
  open_flags: 0,
  critical_flags: 0,
  pending_deltas: 0,
  merges_today: 0,
  completeness_rules_count: 0,
  ingest_status_breakdown: {},
  trust_distribution: {},
  live_alerts: [],
  activity_feed: [],
};

export default function OverviewDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardResponse>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchOverviewDashboard();
    setData(res);
    setLastSync(new Date().toLocaleTimeString());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const primaryKpis = buildPrimaryKpis(data);
  const completenessKpis = buildCompletenessKpis(
    data,
    () => router.push("/place/list?missingCategory=true"),
    () => router.push("/place/list?missingCoordinates=true"),
    () => router.push("/place/list?stale=true"),
  );
  const secondaryKpis = buildSecondaryKpis(data);
  const footerKpis = buildFooterKpis(data);
  const trustSegments = buildTrustSegments(data);
  const totalIngests = Object.values(data.ingest_status_breakdown).reduce((a, b) => a + b, 0);
  const ingestRows = Object.entries(data.ingest_status_breakdown)
    .sort(([, a], [, b]) => b - a)
    .map(([status, count]) => ({
      status,
      tone: statusTone(status),
      count,
      share: totalIngests > 0 ? Math.max((count / totalIngests) * 100, 1) : 1,
    }));

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
              <span className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-muted)]">
                Live · System Overview
              </span>
            </div>
            <h2 className="font-display-tight mt-2 text-[32px] font-semibold text-[color:var(--text-primary)]">
              Cartographic Intel Dashboard
            </h2>
            <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-[color:var(--text-muted)]">
              Real-time geographical data health and AI analysis metrics.
              {lastSync ? (
                <span className="ml-1 text-[color:var(--orange-400)]">
                  Last sync: {lastSync}
                </span>
              ) : null}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1.5 border-[color:var(--orange-400)]/30 bg-[color:var(--orange-500)]/10 py-1 pl-2 pr-2.5 text-[color:var(--orange-400)]"
            >
              <Sparkles className="h-3 w-3" />
              Live data
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

        {/* Primary KPIs — one strip, lead metric emphasized in place */}
        <motion.section variants={item} className="flex flex-col gap-3">
          <SectionEyebrow label="Primary Metrics" hint="live snapshot" />
          <KpiStrip
            kpis={primaryKpis}
            gridClass="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
            size="lg"
            emphasizeFirst
          />
        </motion.section>

        {/* Unfinished places — every completeness gap an operator can click through and fix */}
        <motion.section variants={item} className="flex flex-col gap-3">
          <SectionEyebrow label="Unfinished Places" hint="click to fix" />
          <KpiStrip
            kpis={completenessKpis}
            gridClass="grid-cols-1 sm:grid-cols-3"
            size="md"
          />
        </motion.section>

        {/* Secondary KPIs */}
        <motion.section variants={item} className="flex flex-col gap-3">
          <SectionEyebrow label="Ingest Pipeline" hint="today" />
          <KpiStrip
            kpis={secondaryKpis}
            gridClass="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
            size="md"
          />
        </motion.section>

        {/* Trust Score + Alerts */}
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
          <motion.div variants={item}>
            <GlassCard>
              <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--surface-2)] ring-1 ring-inset ring-[color:var(--border)]">
                    <Activity className="h-4 w-4 text-[color:var(--text-secondary)]" />
                  </div>
                  <CardTitle className="font-display text-[14px] font-semibold text-[color:var(--text-primary)]">
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
                <div className="shimmer-line flex h-4 overflow-hidden rounded-full ring-1 ring-inset ring-[color:var(--border)]">
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
                      className="flex min-w-0 items-center gap-2 text-[11.5px] text-[color:var(--text-secondary)]"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: s.color }}
                      />
                      <span className="min-w-0 truncate">
                        {s.label}
                        <span className="ml-1 text-[color:var(--text-muted)]">
                          ({s.pct}%)
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </GlassCard>
          </motion.div>

          <motion.div variants={item}>
            <GlassCard tone="danger">
              <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--text-danger)]/15 text-[color:var(--text-danger)] ring-1 ring-inset ring-[color:var(--text-danger)]/25">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <CardTitle className="font-display text-[14px] font-semibold text-[color:var(--text-primary)]">
                    Live AI Alerts
                  </CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className="border-[color:var(--text-danger)]/30 bg-[color:var(--text-danger)]/15 font-mono text-[10px] tracking-wider text-[color:var(--text-danger)]"
                >
                  {data.critical_flags} CRITICAL
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-3.5 px-6 pb-6 pt-5">
                {data.live_alerts.length === 0 ? (
                  <div className="py-4 text-center text-[11.5px] text-[color:var(--text-muted)]">
                    No critical flags open.
                  </div>
                ) : (
                  data.live_alerts.map((alert, i) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.35,
                        delay: 0.3 + i * 0.08,
                        ease: "easeOut",
                      }}
                      whileHover={{ x: 2 }}
                      className="group flex min-w-0 items-start gap-3.5 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-1)] px-4 py-3 transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-2)]"
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                          toneIconWrap[severityTone(alert.severity)],
                        )}
                      >
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 truncate text-[12.5px] font-medium text-[color:var(--text-primary)]">
                            {alert.flag_code} · place #{alert.place_id}
                          </div>
                          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-70" />
                        </div>
                        <div className="mt-1 truncate text-[11.5px] text-[color:var(--text-muted)]">
                          {alert.message}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </CardContent>
            </GlassCard>
          </motion.div>
        </div>

        {/* Ingest breakdown + Activity feed */}
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
          <motion.div variants={item}>
            <GlassCard>
              <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--surface-2)] ring-1 ring-inset ring-[color:var(--border)]">
                    <Waves className="h-4 w-4 text-[color:var(--text-secondary)]" />
                  </div>
                  <CardTitle className="font-display text-[14px] font-semibold text-[color:var(--text-primary)]">
                    Ingest Status Breakdown
                  </CardTitle>
                </div>
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-[color:var(--text-muted)]">
                  all-time
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
                      <span className="font-mono text-[12.5px] text-[color:var(--text-primary)] tabular-nums">
                        {row.count.toLocaleString()}
                      </span>
                      <div className="relative">
                        <Progress
                          value={Math.max(row.share, 1)}
                          className={cn(
                            "h-2 bg-[color:var(--surface-2)]",
                            row.tone === "success"
                              ? "[&>[data-slot=progress-indicator]]:bg-[color:var(--text-success)]"
                              : row.tone === "warning"
                                ? "[&>[data-slot=progress-indicator]]:bg-[color:var(--text-warning)]"
                                : row.tone === "danger"
                                  ? "[&>[data-slot=progress-indicator]]:bg-[color:var(--text-danger)]"
                                  : row.tone === "accent"
                                    ? "[&>[data-slot=progress-indicator]]:bg-[color:var(--orange-400)]"
                                    : "[&>[data-slot=progress-indicator]]:bg-[color:var(--text-muted)]",
                          )}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </GlassCard>
          </motion.div>

          <motion.div variants={item}>
            <GlassCard>
              <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--surface-2)] ring-1 ring-inset ring-[color:var(--border)]">
                    <Timer className="h-4 w-4 text-[color:var(--text-secondary)]" />
                  </div>
                  <CardTitle className="font-display text-[14px] font-semibold text-[color:var(--text-primary)]">
                    System Activity
                  </CardTitle>
                </div>
                <span className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-[color:var(--text-muted)]">
                  <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--text-success)]" />
                  Streaming
                </span>
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5 px-6 pb-6 pt-5">
                {data.activity_feed.length === 0 ? (
                  <div className="py-4 text-center text-[11.5px] text-[color:var(--text-muted)]">
                    No completed ingests yet.
                  </div>
                ) : (
                  data.activity_feed.map((entry, i) => (
                    <motion.div
                      key={`${entry.status}-${entry.at}-${i}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.32,
                        delay: 0.25 + i * 0.07,
                        ease: "easeOut",
                      }}
                      className="grid grid-cols-[104px_64px_1fr] items-center gap-3.5 rounded-md px-3 py-2.5 transition hover:bg-[color:var(--surface-2)]"
                    >
                      <StatusBadge tone={statusTone(entry.status)} fixed>
                        {entry.status}
                      </StatusBadge>
                      <span className="font-mono text-[10.5px] uppercase text-[color:var(--text-muted)]">
                        {timeAgo(entry.at)}
                      </span>
                      <span className="truncate text-[12.5px] text-[color:var(--text-secondary)]">
                        {entry.detail}
                      </span>
                    </motion.div>
                  ))
                )}
              </CardContent>
            </GlassCard>
          </motion.div>
        </div>

        {/* Footer KPIs */}
        <motion.section variants={item} className="flex flex-col gap-3">
          <SectionEyebrow label="Quality Signals" hint="pending action" />
          <KpiStrip
            kpis={footerKpis}
            gridClass="grid-cols-2 xl:grid-cols-4"
            size="sm"
          />
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
