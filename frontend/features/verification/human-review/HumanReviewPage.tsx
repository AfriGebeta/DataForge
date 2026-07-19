"use client";

import { type ComponentType } from "react";
import { motion, type Variants } from "framer-motion";
import {
  AlertTriangle,
  ArrowUp,
  CheckCircle2,
  Circle,
  ClipboardList,
  Edit3,
  Layers,
  Map as MapIcon,
  Route,
  Sparkles,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

type Task = {
  id: string;
  title: string;
  type: string;
  aiConfidence: number;
  aiTone: Tone;
  active?: boolean;
};

const tasks: Task[] = [
  {
    id: "REQ-892A",
    title: "Bole Road Alignment",
    type: "Geometry Shift",
    aiConfidence: 42,
    aiTone: "danger",
    active: true,
  },
  {
    id: "REQ-891B",
    title: "Piassa Intersection",
    type: "Missing Node",
    aiConfidence: 66,
    aiTone: "warning",
  },
  {
    id: "REQ-890C",
    title: "Mexico Square POI",
    type: "Attribute Update",
    aiConfidence: 88,
    aiTone: "success",
  },
];

type Audit = {
  text: string;
  when: string;
  tone: Tone;
};

const auditTrail: Audit[] = [
  {
    text: "AI Model flagged lane mismatch.",
    when: "Today, 10:42 AM",
    tone: "accent",
  },
  {
    text: "Data ingested from telemetry source A-49.",
    when: "Yesterday, 14:30 PM",
    tone: "neutral",
  },
  {
    text: "Record initially created.",
    when: "Oct 12, 2023",
    tone: "neutral",
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

type ActionButton = {
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
}: ActionButton) {
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
        "inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[11.5px] font-medium transition",
        toneClass,
        full && "w-full",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function FieldRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-white/40">
        {label}
      </div>
      <div
        className={cn(
          "rounded border px-2.5 py-1.5 font-mono text-[11.5px]",
          highlight
            ? "border-[color:var(--text-success)]/40 bg-[color:var(--text-success)]/[0.08] text-[color:var(--text-success)]"
            : "border-white/10 bg-white/[0.04] text-white/80",
        )}
      >
        {value}
      </div>
    </div>
  );
}

export default function HumanReviewPage() {
  return (
    <div
      className="view active relative min-h-full overflow-hidden bg-[color:var(--surface-0)] px-6 pt-10 pb-8 md:px-10 md:pt-14 md:pb-10 xl:px-14 xl:pt-16 xl:pb-12"
      id="v-human-review"
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
                Live · Review Workflow
              </span>
            </div>
            <h2 className="font-display-tight mt-2 text-[32px] font-semibold text-white">
              Human Review
            </h2>
            <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/55">
              Manage pending tasks and validate AI geographic inferences.
              <span className="ml-1 text-[color:var(--orange-400)]">
                14 pending
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="glass-surface glass-glow flex items-center gap-1 rounded-lg border-0 p-1">
              <button className="rounded-md bg-[color:var(--orange-500)]/15 px-3 py-1 text-[11.5px] font-medium text-[color:var(--orange-400)]">
                Queue
              </button>
              <button className="rounded-md px-3 py-1 text-[11.5px] font-medium text-white/60 transition hover:text-white/85">
                Escalated
              </button>
            </div>
            <Badge
              variant="outline"
              className="gap-1.5 border-[color:var(--orange-400)]/30 bg-[color:var(--orange-500)]/10 py-1 pl-2 pr-2.5 text-[color:var(--orange-400)]"
            >
              <Sparkles className="h-3 w-3" />
              AI Suggestions
            </Badge>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-7 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          {/* LEFT: pending list */}
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
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <CardTitle className="font-display text-[14px] font-semibold text-white/90">
                    Pending (14)
                  </CardTitle>
                </div>
                <button className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-white/70 transition hover:bg-white/[0.06]">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                </button>
              </CardHeader>
              <CardContent className="flex flex-col gap-2.5 px-6 pb-6 pt-5">
                {tasks.map((t, i) => (
                  <motion.div
                    key={t.id}
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
                      t.active
                        ? "border-[color:var(--orange-400)]/35 bg-[color:var(--orange-500)]/[0.06] ring-1 ring-inset ring-[color:var(--orange-400)]/20"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "font-mono text-[10.5px]",
                          t.active
                            ? "text-[color:var(--orange-400)]"
                            : "text-white/55",
                        )}
                      >
                        {t.id}
                      </span>
                      <StatusBadge tone={t.aiTone}>
                        AI {t.aiConfidence}%
                      </StatusBadge>
                    </div>
                    <div className="mt-1.5 text-[12.5px] font-medium text-white/90">
                      {t.title}
                    </div>
                    <div className="mt-0.5 text-[10.5px] text-white/50">
                      {t.type}
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* RIGHT: map + fields + actions */}
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
                      <Route className="h-4 w-4" />
                    </div>
                    <CardTitle className="font-display text-[14px] font-semibold text-white/90">
                      Diff — Bole Road Alignment
                    </CardTitle>
                  </div>
                  <StatusBadge tone="accent">REQ-892A</StatusBadge>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 px-6 pb-6 pt-5">
                  <div className="relative flex h-[190px] flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]">
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-2xl",
                        toneIconWrap.accent,
                      )}
                    >
                      <MapIcon className="h-6 w-6" />
                    </div>
                    <div className="text-[12px] text-white/60">
                      Map Canvas Render Area
                    </div>
                    <div className="font-mono text-[10.5px] text-white/40">
                      9.005401, 38.763611
                    </div>
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md border border-white/10 bg-black/30 px-2 py-1 font-mono text-[9.5px] uppercase tracking-wider text-white/50 backdrop-blur">
                      <Layers className="h-3 w-3" />
                      overlay · diff
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3.5">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
                        Original Record
                      </div>
                      <div className="mt-3 flex flex-col gap-2.5">
                        <FieldRow label="Name" value="Bole Road" />
                        <FieldRow label="Lanes" value="2" />
                      </div>
                    </div>
                    <div className="rounded-lg border border-[color:var(--orange-400)]/40 bg-[color:var(--orange-500)]/[0.06] p-3.5">
                      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--orange-400)]">
                        AI Proposed
                        <StatusBadge tone="accent">+1 CHANGE</StatusBadge>
                      </div>
                      <div className="mt-3 flex flex-col gap-2.5">
                        <FieldRow label="Name" value="Bole Road" />
                        <FieldRow label="Lanes" value="4" highlight />
                      </div>
                    </div>
                  </div>
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
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <CardTitle className="font-display text-[14px] font-semibold text-white/90">
                      Resolution
                    </CardTitle>
                  </div>
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-white/45">
                    audit ready
                  </span>
                </CardHeader>
                <CardContent className="flex flex-col gap-5 px-6 pb-6 pt-5">
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    <GlassButton
                      label="Approve AI Suggestion"
                      icon={CheckCircle2}
                      tone="success"
                      full
                    />
                    <GlassButton
                      label="Reject & Keep Original"
                      icon={X}
                      tone="danger"
                      full
                    />
                    <GlassButton label="Manual Override" icon={Edit3} full />
                  </div>

                  <div className="h-px w-full bg-white/5" />

                  <div>
                    <div className="flex items-center justify-between text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/55">
                      Audit Trail
                      <button className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] normal-case text-white/70 transition hover:bg-white/[0.06]">
                        <ArrowUp className="h-3 w-3" />
                        Escalate
                      </button>
                    </div>
                    <div className="mt-3 flex flex-col gap-2.5">
                      {auditTrail.map((a, i) => {
                        const Icon =
                          a.tone === "accent" ? AlertTriangle : Circle;
                        return (
                          <motion.div
                            key={a.text + i}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              duration: 0.3,
                              delay: 0.2 + i * 0.06,
                            }}
                            className="flex items-start gap-2.5 text-[11.5px]"
                          >
                            <Icon
                              className={cn(
                                "mt-0.5 h-3 w-3 shrink-0",
                                a.tone === "accent"
                                  ? toneText.accent
                                  : "text-white/30",
                              )}
                            />
                            <div className="flex-1 text-white/80">
                              {a.text}
                              <span className="ml-1.5 text-white/40">
                                · {a.when}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
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
