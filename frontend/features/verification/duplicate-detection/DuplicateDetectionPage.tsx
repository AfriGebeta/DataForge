"use client";

import { type ComponentType } from "react";
import { motion, type Variants } from "framer-motion";
import {
  AlertTriangle,
  Building2,
  Check,
  Copy,
  Fingerprint,
  GitMerge,
  Layers,
  MapPin,
  Network,
  Plane,
  Ruler,
  Sparkles,
  X,
  ZoomIn,
  ZoomOut,
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

const toneProgressBar: Record<Tone, string> = {
  neutral: "[&>[data-slot=progress-indicator]]:bg-white/60",
  accent: "[&>[data-slot=progress-indicator]]:bg-[color:var(--orange-400)]",
  success:
    "[&>[data-slot=progress-indicator]]:bg-[color:var(--text-success)]",
  warning:
    "[&>[data-slot=progress-indicator]]:bg-[color:var(--text-warning)]",
  danger: "[&>[data-slot=progress-indicator]]:bg-[color:var(--text-danger)]",
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

type Cluster = {
  name: string;
  icon: ComponentType<{ className?: string }>;
  records: number;
  distanceKm: number;
  confidence: string;
  confidenceTone: Tone;
  active?: boolean;
};

const clusters: Cluster[] = [
  {
    name: "Bole Airport",
    icon: Plane,
    records: 2,
    distanceKm: 0.4,
    confidence: "High",
    confidenceTone: "danger",
    active: true,
  },
  {
    name: "St. Jude Medical",
    icon: Building2,
    records: 3,
    distanceKm: 1.2,
    confidence: "Medium",
    confidenceTone: "warning",
  },
  {
    name: "Meskel Square Complex",
    icon: MapPin,
    records: 4,
    distanceKm: 0.8,
    confidence: "Medium",
    confidenceTone: "warning",
  },
];

type Metric = {
  label: string;
  value: number;
  tone: Tone;
  note?: string;
};

const similarityMetrics: Metric[] = [
  { label: "Name Similarity", value: 94, tone: "danger" },
  { label: "Coordinate Distance", value: 88, tone: "warning", note: "Δ 400m" },
  { label: "Metadata Match", value: 76, tone: "accent" },
  {
    label: "Embedding Similarity",
    value: 98,
    tone: "danger",
    note: "Vector DB Match",
  },
];

type EntityField = {
  label: string;
  value: string;
  highlight?: boolean;
};

const entityA: EntityField[] = [
  { label: "Name", value: "Bole International Airport" },
  { label: "Coordinates", value: "9.0300° N, 38.7400° E" },
  { label: "Category", value: "Transportation / Aviation" },
  { label: "Last Verified", value: "2023-10-15 (OSM)" },
];

const entityB: EntityField[] = [
  {
    label: "Name",
    value: "Addis Ababa Bole Int'l",
    highlight: true,
  },
  { label: "Coordinates", value: "9.0288° N, 38.7411° E" },
  { label: "Category", value: "Airport" },
  { label: "Last Verified", value: "2023-11-02 (Gov Data)" },
];

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

function StatusBadge({
  tone,
  children,
}: {
  tone: Tone;
  children: React.ReactNode;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono tracking-wide text-[10px] px-2 py-0.5",
        toneBadgeVariant[tone],
      )}
    >
      {children}
    </Badge>
  );
}

type GlassButtonProps = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  tone?: Tone;
  full?: boolean;
};

function GlassButton({
  label,
  icon: Icon,
  tone = "neutral",
  full,
}: GlassButtonProps) {
  const toneClass =
    tone === "accent"
      ? "border-[color:var(--orange-400)]/30 bg-[color:var(--orange-500)]/12 text-[color:var(--orange-400)] hover:bg-[color:var(--orange-500)]/20"
      : tone === "success"
        ? "border-[color:var(--text-success)]/30 bg-[color:var(--text-success)]/12 text-[color:var(--text-success)] hover:bg-[color:var(--text-success)]/20"
        : tone === "danger"
          ? "border-[color:var(--text-danger)]/30 bg-[color:var(--text-danger)]/12 text-[color:var(--text-danger)] hover:bg-[color:var(--text-danger)]/20"
          : "border-white/10 bg-white/[0.04] text-white/85 hover:bg-white/[0.08] hover:text-white";
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11.5px] font-medium transition",
        toneClass,
        full && "w-full",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function EntityCard({
  fields,
  recordId,
  master,
}: {
  fields: EntityField[];
  recordId: string;
  master?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3.5 transition",
        master
          ? "border-[color:var(--orange-400)]/40 bg-[color:var(--orange-500)]/[0.06]"
          : "border-white/10 bg-white/[0.02]",
      )}
    >
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
        <span>{recordId}</span>
        {master ? (
          <StatusBadge tone="accent">MASTER</StatusBadge>
        ) : (
          <button className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[9.5px] uppercase tracking-wider text-white/70 transition hover:bg-white/[0.06]">
            Set Master
          </button>
        )}
      </div>
      <div className="mt-3 flex flex-col gap-2.5">
        {fields.map((f) => (
          <div key={f.label} className="flex flex-col gap-1">
            <div className="text-[9.5px] uppercase tracking-[0.12em] text-white/40">
              {f.label}
            </div>
            <div
              className={cn(
                "rounded border px-2.5 py-1.5 font-mono text-[11.5px]",
                f.highlight
                  ? "border-[color:var(--orange-400)]/40 bg-[color:var(--orange-500)]/[0.1] text-[color:var(--orange-400)]"
                  : "border-white/10 bg-white/[0.04] text-white/80",
              )}
            >
              {f.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DuplicateDetectionPage() {
  return (
    <div
      className="view active relative min-h-full overflow-hidden bg-[color:var(--surface-0)] px-6 pt-10 pb-8 md:px-10 md:pt-14 md:pb-10 xl:px-14 xl:pt-16 xl:pb-12"
      id="v-duplicate-detection"
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
              <span className="inline-flex h-2 w-2 rounded-full bg-[color:var(--orange-400)] pulse-dot" />
              <span className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
                Live · Entity Resolution
              </span>
            </div>
            <h2 className="font-display-tight mt-2 text-[32px] font-semibold text-white">
              Duplicate Detection
            </h2>
            <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/55">
              AI-powered entity matching with similarity metrics and resolution
              graphs.
              <span className="ml-1 text-[color:var(--orange-400)]">
                3 active clusters
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1.5 border-[color:var(--orange-400)]/30 bg-[color:var(--orange-500)]/10 py-1 pl-2 pr-2.5 text-[color:var(--orange-400)]"
            >
              <Sparkles className="h-3 w-3" />
              Embeddings Live
            </Badge>
            <button
              type="button"
              className="glass-surface glass-glow relative inline-flex items-center gap-1.5 rounded-lg border-0 px-3 py-1.5 text-[12px] font-medium text-white/85 transition hover:text-white"
            >
              <Layers className="h-3.5 w-3.5" />
              View All
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-7 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          {/* LEFT column: clusters + similarity */}
          <div className="flex flex-col gap-7">
            <motion.div variants={item}>
              <Card className="glass-surface glass-glow relative overflow-hidden border-0 py-0">
                <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md",
                        toneIconWrap.accent,
                      )}
                    >
                      <Copy className="h-4 w-4" />
                    </div>
                    <CardTitle className="font-display text-[14px] font-semibold text-white/90">
                      Active Clusters
                    </CardTitle>
                  </div>
                  <StatusBadge tone="accent">3 ACTIVE</StatusBadge>
                </CardHeader>
                <CardContent className="flex flex-col gap-2.5 px-6 pb-6 pt-5">
                  {clusters.map((c, i) => {
                    const Icon = c.icon;
                    return (
                      <motion.div
                        key={c.name}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.32,
                          delay: 0.2 + i * 0.07,
                          ease: "easeOut",
                        }}
                        whileHover={{ x: 2 }}
                        className={cn(
                          "group cursor-pointer rounded-lg border p-3 transition",
                          c.active
                            ? "border-[color:var(--orange-400)]/35 bg-[color:var(--orange-500)]/[0.06] ring-1 ring-inset ring-[color:var(--orange-400)]/20"
                            : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-[13px] font-medium text-white/90">
                            <div
                              className={cn(
                                "flex h-7 w-7 items-center justify-center rounded-md",
                                c.active
                                  ? toneIconWrap.accent
                                  : toneIconWrap.neutral,
                              )}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            {c.name}
                          </div>
                          <StatusBadge tone={c.confidenceTone}>
                            {c.confidence}
                          </StatusBadge>
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-[10.5px] text-white/50">
                          <span className="font-mono">
                            {c.records} entities
                          </span>
                          <span className="h-1 w-1 rounded-full bg-white/20" />
                          <span className="font-mono">{c.distanceKm} km</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card className="glass-surface glass-glow relative overflow-hidden border-0 py-0">
                <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md",
                        toneIconWrap.neutral,
                      )}
                    >
                      <Fingerprint className="h-4 w-4" />
                    </div>
                    <CardTitle className="font-display text-[14px] font-semibold text-white/90">
                      AI Similarity Metrics
                    </CardTitle>
                  </div>
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-white/45">
                    live
                  </span>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 px-6 pb-6 pt-5">
                  {similarityMetrics.map((m, i) => (
                    <motion.div
                      key={m.label}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.32,
                        delay: 0.2 + i * 0.06,
                        ease: "easeOut",
                      }}
                    >
                      <div className="flex items-center justify-between text-[11.5px] text-white/70">
                        <span>{m.label}</span>
                        <span
                          className={cn(
                            "font-mono font-semibold tabular-nums",
                            toneText[m.tone],
                          )}
                        >
                          {m.value}%
                        </span>
                      </div>
                      <Progress
                        value={m.value}
                        className={cn(
                          "mt-1.5 h-1.5 bg-white/5",
                          toneProgressBar[m.tone],
                        )}
                      />
                      {m.note ? (
                        <div className="mt-1 text-[10px] text-white/40">
                          {m.note}
                        </div>
                      ) : null}
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* RIGHT column: merge preview + graph */}
          <div className="flex flex-col gap-7">
            <motion.div variants={item}>
              <Card className="glass-surface glass-glow relative overflow-hidden border-0 py-0">
                <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md",
                        toneIconWrap.neutral,
                      )}
                    >
                      <GitMerge className="h-4 w-4" />
                    </div>
                    <CardTitle className="font-display text-[14px] font-semibold text-white/90">
                      Merge Preview
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <GlassButton label="Distinct" icon={X} />
                    <GlassButton
                      label="Confirm Merge"
                      icon={Check}
                      tone="accent"
                    />
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 px-6 pb-6 pt-5 md:grid-cols-2">
                  <EntityCard fields={entityA} recordId="GE0-8821-A" />
                  <EntityCard fields={entityB} recordId="GE0-9942-B" master />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card className="glass-surface glass-glow relative overflow-hidden border-0 py-0">
                <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md",
                        toneIconWrap.neutral,
                      )}
                    >
                      <Network className="h-4 w-4" />
                    </div>
                    <CardTitle className="font-display text-[14px] font-semibold text-white/90">
                      Entity Resolution Graph
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-white/70 transition hover:bg-white/[0.06]">
                      <ZoomIn className="h-3.5 w-3.5" />
                    </button>
                    <button className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-white/70 transition hover:bg-white/[0.06]">
                      <ZoomOut className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-5">
                  <div className="relative h-[180px] overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]">
                    <div className="absolute inset-0 flex items-center justify-center gap-10">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="flex flex-col items-center gap-2"
                      >
                        <div
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-full",
                            toneIconWrap.neutral,
                          )}
                        >
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div className="font-mono text-[10.5px] text-white/70">
                          GEO-8821-A
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 60 }}
                        transition={{
                          duration: 0.6,
                          delay: 0.3,
                          ease: "easeOut",
                        }}
                        className="relative h-px bg-gradient-to-r from-white/10 via-[color:var(--orange-400)]/60 to-white/10"
                      >
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[9.5px] uppercase tracking-wider text-[color:var(--orange-400)]/80">
                          0.4 km
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.4,
                          delay: 0.2,
                          ease: "easeOut",
                        }}
                        className="flex flex-col items-center gap-2"
                      >
                        <div
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-full ring-2 ring-[color:var(--orange-400)]/60",
                            toneIconWrap.accent,
                          )}
                        >
                          <Plane className="h-5 w-5" />
                        </div>
                        <div className="font-mono text-[10.5px] text-[color:var(--orange-400)]">
                          GEO-9942-B
                        </div>
                      </motion.div>
                    </div>

                    <div className="absolute right-3 top-3 flex items-center gap-1.5">
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full",
                          toneIconWrap.danger,
                        )}
                      >
                        <AlertTriangle className="h-3 w-3" />
                      </div>
                      <div className="font-mono text-[9.5px] uppercase tracking-wider text-white/50">
                        Alias_1
                      </div>
                    </div>

                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md border border-white/10 bg-black/30 px-2 py-1 font-mono text-[9.5px] uppercase tracking-wider text-white/50 backdrop-blur">
                      <Ruler className="h-3 w-3" />
                      graph · 2 nodes
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
