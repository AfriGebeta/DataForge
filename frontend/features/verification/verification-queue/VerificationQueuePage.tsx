"use client";

import { type ComponentType } from "react";
import { motion, type Variants } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUp,
  Check,
  CheckCircle2,
  ClipboardList,
  Copy,
  Edit3,
  Filter,
  GitMerge,
  ListChecks,
  MapPin,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Trash2,
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

type QueueRow = {
  id: string;
  name: string;
  location: string;
  coords: string;
  trust: number;
  trustTone: Tone;
  status: string;
  statusTone: Tone;
  dup: string;
  dupTone: Tone;
  highlight?: boolean;
};

const queueRows: QueueRow[] = [
  {
    id: "LOC-8492-X",
    name: "Starbucks Reserve",
    location: "Seattle, WA, US",
    coords: "47.614, -122.329",
    trust: 42,
    trustTone: "danger",
    status: "Pending",
    statusTone: "warning",
    dup: "High 98%",
    dupTone: "danger",
    highlight: true,
  },
  {
    id: "LOC-3129-A",
    name: "Blue Bottle Coffee",
    location: "San Francisco, CA",
    coords: "37.774, -122.419",
    trust: 88,
    trustTone: "success",
    status: "Pending",
    statusTone: "warning",
    dup: "Med 45%",
    dupTone: "warning",
  },
  {
    id: "LOC-9942-B",
    name: "Peet's Coffee & Tea",
    location: "Berkeley, CA, US",
    coords: "37.871, -122.272",
    trust: 65,
    trustTone: "neutral",
    status: "Pending",
    statusTone: "warning",
    dup: "Low 12%",
    dupTone: "success",
  },
];

type Signal = {
  icon: ComponentType<{ className?: string }>;
  tone: Tone;
  text: string;
};

const aiSignals: Signal[] = [
  {
    icon: AlertCircle,
    tone: "danger",
    text: "High Spatial Similarity — 12m from LOC-102",
  },
  {
    icon: AlertTriangle,
    tone: "warning",
    text: "Name Normalization Mismatch — possible alias",
  },
  {
    icon: CheckCircle2,
    tone: "success",
    text: "Valid Address Format — USPS standard",
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

type ActionButton = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  tone?: Tone;
};

function GlassButton({
  label,
  icon: Icon,
  tone = "neutral",
  full,
}: ActionButton & { full?: boolean }) {
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

export default function VerificationQueuePage() {
  return (
    <div
      className="view active relative min-h-full overflow-hidden bg-[color:var(--surface-0)] px-6 pt-10 pb-8 md:px-10 md:pt-14 md:pb-10 xl:px-14 xl:pt-16 xl:pb-12"
      id="v-verification-queue"
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
                Live · Human Review › Queue
              </span>
            </div>
            <h2 className="font-display-tight mt-2 text-[32px] font-semibold text-white">
              Verification Queue
            </h2>
            <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/55">
              Review and validate flagged place records.
              <span className="ml-1 text-[color:var(--orange-400)]">
                142 items awaiting action
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1.5 border-[color:var(--text-danger)]/30 bg-[color:var(--text-danger)]/12 py-1 pl-2 pr-2.5 text-[color:var(--text-danger)]"
            >
              <ShieldAlert className="h-3 w-3" />
              12 High Priority
            </Badge>
            <button
              type="button"
              className="glass-surface glass-glow relative inline-flex items-center gap-1.5 rounded-lg border-0 px-3 py-1.5 text-[12px] font-medium text-white/85 transition hover:text-white"
            >
              <Filter className="h-3.5 w-3.5" />
              Filter
            </button>
          </div>
        </motion.div>

        {/* Metrics */}
        <motion.section variants={item} className="flex flex-col gap-3">
          <SectionEyebrow label="Queue Snapshot" hint="live counters" />
          <motion.div
            variants={container}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4"
          >
            {[
              {
                label: "Queue Items",
                value: 142,
                icon: ListChecks,
                tone: "accent" as Tone,
                delta: "3 in review",
              },
              {
                label: "High Priority",
                value: 12,
                icon: ShieldAlert,
                tone: "danger" as Tone,
                delta: "action required",
              },
              {
                label: "Duplicate Risk",
                value: 45,
                icon: Copy,
                tone: "warning" as Tone,
                delta: "cluster ready",
              },
              {
                label: "Approved Today",
                value: 87,
                icon: CheckCircle2,
                tone: "success" as Tone,
                delta: "+18% vs yesterday",
              },
            ].map((k) => {
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
                        {k.value.toLocaleString()}
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

        {/* Main content: Queue table + Review detail */}
        <div className="grid grid-cols-1 gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
          <motion.div variants={item}>
            <GlassCard>
              <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 ring-1 ring-inset ring-white/10">
                    <ClipboardList className="h-4 w-4 text-white/75" />
                  </div>
                  <CardTitle className="font-display text-[14px] font-semibold text-white/90">
                    Flagged Records
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge tone="accent">3 SELECTED</StatusBadge>
                  <button className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/75 transition hover:bg-white/[0.06]">
                    <SlidersHorizontal className="h-3 w-3" />
                    Sort
                  </button>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-5">
                <div className="overflow-hidden rounded-lg ring-1 ring-inset ring-white/10">
                  <table className="w-full text-left text-[12px]">
                    <thead>
                      <tr className="bg-white/[0.02] text-[10px] uppercase tracking-[0.14em] text-white/45">
                        <th className="px-4 py-3 font-medium">Place ID</th>
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium">Coordinates</th>
                        <th className="px-4 py-3 font-medium">Trust</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Dup Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {queueRows.map((row, i) => (
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
                            row.highlight && "bg-[color:var(--orange-500)]/[0.05]",
                          )}
                        >
                          <td className="px-4 py-3 font-mono text-[11px] text-white/70">
                            {row.id}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-white/90">
                              {row.name}
                            </div>
                            <div className="text-[10.5px] text-white/45">
                              {row.location}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-white/70">
                            {row.coords}
                          </td>
                          <td
                            className={cn(
                              "px-4 py-3 font-mono text-[11.5px] tabular-nums",
                              toneText[row.trustTone],
                            )}
                          >
                            {row.trust}%
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge tone={row.statusTone}>
                              {row.status}
                            </StatusBadge>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge tone={row.dupTone}>
                              {row.dup}
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
            <GlassCard tone="accent">
              <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-md",
                      toneIconWrap.accent,
                    )}
                  >
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <CardTitle className="font-display text-[14px] font-semibold text-white/90">
                    Review Task #8492
                  </CardTitle>
                </div>
                <StatusBadge tone="accent">DUPLICATE</StatusBadge>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 px-6 pb-6 pt-5">
                <div>
                  <div className="text-[14px] font-semibold text-white/90">
                    Starbucks Reserve
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-white/55">
                    <MapPin className="h-3 w-3" />
                    47.61401, -122.32924
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3.5">
                  <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
                    AI Confidence
                    <span className="text-[color:var(--text-danger)]">
                      42% Trust
                    </span>
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    {aiSignals.map((s) => {
                      const Icon = s.icon;
                      return (
                        <div
                          key={s.text}
                          className="flex items-start gap-2 text-[11.5px] text-white/80"
                        >
                          <Icon
                            className={cn(
                              "mt-0.5 h-3.5 w-3.5 shrink-0",
                              toneText[s.tone],
                            )}
                          />
                          <span>{s.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3.5">
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/55">
                    Top Duplicate Candidate
                  </div>
                  <div className="mt-2.5 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[12.5px] font-medium text-white/90">
                        Starbucks Roastery
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[10.5px] text-white/55">
                        1124 Pike St, Seattle
                        <StatusBadge tone="success">MASTER</StatusBadge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[13px] font-semibold text-[color:var(--text-danger)] tabular-nums">
                        98%
                      </div>
                      <div className="text-[10px] text-white/45">12m away</div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <GlassButton label="Compare" icon={Copy} />
                    <GlassButton label="Merge" icon={GitMerge} tone="accent" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <GlassButton label="Edit" icon={Edit3} />
                  <GlassButton label="Escalate" icon={ArrowUp} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <GlassButton label="Reject" icon={Trash2} tone="danger" />
                  <GlassButton label="Approve" icon={Check} tone="success" />
                </div>
              </CardContent>
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
