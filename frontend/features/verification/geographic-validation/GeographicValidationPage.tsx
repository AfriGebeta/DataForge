"use client";

import { type ComponentType } from "react";
import { motion, type Variants } from "framer-motion";
import {
  Building,
  Building2,
  Database,
  Globe2,
  Map as MapIcon,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
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

type ConsistencyRow = {
  entity: string;
  geocoded: string;
  country: string;
  zone: string;
  status: string;
  statusTone: Tone;
};

const consistencyRows: ConsistencyRow[] = [
  {
    entity: "Bole International Airport",
    geocoded: "Bole",
    country: "Ethiopia",
    zone: "Addis Ababa",
    status: "VALID",
    statusTone: "success",
  },
  {
    entity: "Addis Ababa Museum",
    geocoded: "Addis Ababa",
    country: "Ethiopia",
    zone: "Addis Ababa",
    status: "VALID",
    statusTone: "success",
  },
  {
    entity: "Hawassa Industrial Park",
    geocoded: "Hawassa",
    country: "Ethiopia",
    zone: "Sidama",
    status: "VALID",
    statusTone: "success",
  },
  {
    entity: "Dire Dawa Central",
    geocoded: "Dire Dawa",
    country: "Ethiopia",
    zone: "Oromia",
    status: "MISMATCH",
    statusTone: "danger",
  },
];

type HierarchyNode = {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  tone: Tone;
  expected?: string;
  pending?: boolean;
};

const hierarchy: HierarchyNode[] = [
  { label: "Country", value: "Ethiopia", icon: Globe2, tone: "accent" },
  { label: "Region", value: "Oromia", icon: MapIcon, tone: "accent" },
  {
    label: "City",
    value: "Dire Dawa",
    icon: Building,
    tone: "danger",
    expected: "Adama",
  },
  {
    label: "District",
    value: "Pending…",
    icon: Building2,
    tone: "neutral",
    pending: true,
  },
];

type KnowledgeSource = {
  name: string;
  latency: string;
  detail: string;
  tone: Tone;
};

const sources: KnowledgeSource[] = [
  {
    name: "Gebeta GeoDB",
    latency: "12ms",
    detail: "Queried node: admin_boundary_eth_oromia",
    tone: "success",
  },
  {
    name: "OpenStreetMap API",
    latency: "145ms",
    detail: "Extracted: place=city, is_in:country=Ethiopia. Mismatch…",
    tone: "accent",
  },
  {
    name: "Gov Spatial Registry",
    latency: "Timeout",
    detail: "Endpoint unreachable. Fallback logic applied.",
    tone: "danger",
  },
];

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

export default function GeographicValidationPage() {
  const rag = 64;
  return (
    <div
      className="view active relative min-h-full overflow-hidden bg-[color:var(--surface-0)] px-6 pt-10 pb-8 md:px-10 md:pt-14 md:pb-10 xl:px-14 xl:pt-16 xl:pb-12"
      id="v-geographic-validation"
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
                Live · Spatial Intelligence
              </span>
            </div>
            <h2 className="font-display-tight mt-2 text-[32px] font-semibold text-white">
              Geographic Validation
            </h2>
            <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/55">
              Country-level and administrative hierarchy anomaly detection.
              <span className="ml-1 text-[color:var(--text-danger)]">
                1 anomaly detected
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1.5 border-[color:var(--text-danger)]/30 bg-[color:var(--text-danger)]/12 py-1 pl-2 pr-2.5 text-[color:var(--text-danger)]"
            >
              <ShieldCheck className="h-3 w-3" />
              Anomalies Detected
            </Badge>
            <button
              type="button"
              className="glass-surface glass-glow relative inline-flex items-center gap-1.5 rounded-lg border-0 px-3 py-1.5 text-[12px] font-medium text-white/85 transition hover:text-white"
            >
              <MapIcon className="h-3.5 w-3.5" />
              Map Context
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-7 xl:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
          {/* LEFT column: checks */}
          <div className="flex flex-col gap-7">
            <motion.div variants={item}>
              <GlassCard>
                <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md",
                        toneIconWrap.neutral,
                      )}
                    >
                      <Globe2 className="h-4 w-4" />
                    </div>
                    <CardTitle className="font-display text-[14px] font-semibold text-white/90">
                      Country Consistency Check
                    </CardTitle>
                  </div>
                  <StatusBadge tone="success">3 / 4 VALID</StatusBadge>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-5">
                  <div className="overflow-hidden rounded-lg ring-1 ring-inset ring-white/10">
                    <table className="w-full text-left text-[12px]">
                      <thead>
                        <tr className="bg-white/[0.02] text-[10px] uppercase tracking-[0.14em] text-white/45">
                          <th className="px-4 py-3 font-medium">Input Entity</th>
                          <th className="px-4 py-3 font-medium">Geocoded</th>
                          <th className="px-4 py-3 font-medium">Country</th>
                          <th className="px-4 py-3 font-medium">Zone</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consistencyRows.map((row, i) => (
                          <motion.tr
                            key={row.entity}
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
                                "bg-[color:var(--text-danger)]/[0.05]",
                            )}
                          >
                            <td className="px-4 py-3 font-medium text-white/90">
                              {row.entity}
                            </td>
                            <td className="px-4 py-3 text-white/70">
                              {row.geocoded}
                            </td>
                            <td className="px-4 py-3 text-white/70">
                              {row.country}
                            </td>
                            <td className="px-4 py-3 text-white/70">
                              {row.zone}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge tone={row.statusTone} fixed>
                                {row.status}
                              </StatusBadge>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </GlassCard>
            </motion.div>

            <motion.div variants={item}>
              <GlassCard>
                <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md",
                        toneIconWrap.neutral,
                      )}
                    >
                      <MapPin className="h-4 w-4" />
                    </div>
                    <CardTitle className="font-display text-[14px] font-semibold text-white/90">
                      Administrative Hierarchy
                    </CardTitle>
                  </div>
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-white/45">
                    #AA-992-B
                  </span>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-5">
                  <div className="relative grid grid-cols-4 items-start gap-3">
                    {hierarchy.map((node, i) => {
                      const Icon = node.icon;
                      return (
                        <motion.div
                          key={node.label}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.35,
                            delay: 0.2 + i * 0.08,
                            ease: "easeOut",
                          }}
                          className="relative flex flex-col items-center gap-2 text-center"
                        >
                          {i > 0 ? (
                            <div
                              className={cn(
                                "absolute right-1/2 top-6 -z-0 h-px w-full",
                                node.tone === "danger" ||
                                  hierarchy[i - 1].tone === "danger"
                                  ? "bg-[color:var(--text-danger)]/40"
                                  : "bg-white/10",
                              )}
                              aria-hidden
                            />
                          ) : null}
                          <div
                            className={cn(
                              "relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl",
                              toneIconWrap[node.tone],
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-white/45">
                            {node.label}
                          </div>
                          <div
                            className={cn(
                              "text-[12px] font-semibold",
                              node.pending ? "text-white/40" : toneText[node.tone],
                            )}
                          >
                            {node.value}
                          </div>
                          {node.expected ? (
                            <div className="text-[10px] text-white/50">
                              Expected:{" "}
                              <span className="text-[color:var(--text-success)]">
                                {node.expected}
                              </span>
                            </div>
                          ) : null}
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </GlassCard>
            </motion.div>
          </div>

          {/* RIGHT column: RAG score + sources */}
          <div className="flex flex-col gap-7">
            <motion.div variants={item}>
              <GlassCard tone="danger">
                <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md",
                        toneIconWrap.warning,
                      )}
                    >
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <CardTitle className="font-display text-[14px] font-semibold text-white/90">
                      RAG Confidence
                    </CardTitle>
                  </div>
                  <StatusBadge tone="warning">LOW</StatusBadge>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-5">
                  <div className="flex items-baseline gap-2">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className="font-display-tight text-[52px] font-semibold leading-none text-[color:var(--text-warning)] tabular-nums"
                    >
                      {rag}%
                    </motion.div>
                    <span className="text-[11px] text-white/50">
                      confidence
                    </span>
                  </div>
                  <Progress
                    value={rag}
                    className="mt-4 h-1.5 bg-white/5 [&>[data-slot=progress-indicator]]:bg-[color:var(--text-warning)]"
                  />
                  <div className="mt-4 text-[11.5px] leading-relaxed text-white/60">
                    Confidence degraded: severe administrative hierarchy
                    mismatch detected between expected Region (Oromia) and
                    inputted City (Dire Dawa).
                  </div>
                </CardContent>
              </GlassCard>
            </motion.div>

            <motion.div variants={item}>
              <GlassCard>
                <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md",
                        toneIconWrap.neutral,
                      )}
                    >
                      <Database className="h-4 w-4" />
                    </div>
                    <CardTitle className="font-display text-[14px] font-semibold text-white/90">
                      Knowledge Retrieval
                    </CardTitle>
                  </div>
                  <span className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-white/55">
                    <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--text-success)]" />
                    Live
                  </span>
                </CardHeader>
                <CardContent className="flex flex-col gap-2.5 px-6 pb-6 pt-5">
                  {sources.map((s, i) => (
                    <motion.div
                      key={s.name}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.32,
                        delay: 0.25 + i * 0.07,
                        ease: "easeOut",
                      }}
                      whileHover={{ x: 2 }}
                      className={cn(
                        "flex flex-col gap-1.5 rounded-lg border px-3 py-2.5 transition",
                        s.tone === "danger"
                          ? "border-[color:var(--text-danger)]/25 bg-[color:var(--text-danger)]/[0.04]"
                          : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]",
                      )}
                    >
                      <div className="flex items-center justify-between text-[11.5px]">
                        <span className="font-medium text-white/90">
                          {s.name}
                        </span>
                        <span
                          className={cn(
                            "font-mono font-semibold",
                            toneText[s.tone],
                          )}
                        >
                          {s.latency}
                        </span>
                      </div>
                      <div className="text-[10.5px] text-white/50">
                        {s.detail}
                      </div>
                    </motion.div>
                  ))}
                  <button className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[11.5px] font-medium text-white/85 transition hover:bg-white/[0.06] hover:text-white">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Force Re-fetch Sources
                  </button>
                </CardContent>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
