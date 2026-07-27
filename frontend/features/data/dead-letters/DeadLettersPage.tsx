"use client";

import { motion, type Variants } from "framer-motion";
import {
  AlertOctagon,

  MailWarning,
  RotateCcw,
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

type DeadLetter = {
  id: string;
  queue: string;
  error: string;
  retries: number;
  failed: string;
};

const deadLetters: DeadLetter[] = [
  {
    id: "f2a9…01e1",
    queue: "telegram.poi.ingest",
    error: "geo_resolve timeout after 30s",
    retries: 3,
    failed: "5m ago",
  },
  {
    id: "g3b0…12f2",
    queue: "telegram.poi.ingest",
    error: "schema validation failed",
    retries: 3,
    failed: "22m ago",
  },
  {
    id: "h4c1…23g3",
    queue: "rest.ingest",
    error: "parse error: unexpected token",
    retries: 3,
    failed: "1h ago",
  },
];

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

export default function DeadLettersPage() {
  return (
    <div
      className="view active relative min-h-full overflow-hidden bg-[color:var(--surface-0)] px-6 pt-10 pb-8 md:px-10 md:pt-14 md:pb-10 xl:px-14 xl:pt-16 xl:pb-12"
      id="v-dlq"
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
                Live · Data › Failure Queue
              </span>
            </div>
            <h2 className="font-display-tight mt-2 text-[32px] font-semibold text-white">
              Dead Letters
            </h2>
            <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/55">
              Messages that failed all retry attempts and are queued for manual
              review.
              <span className="ml-1 text-[color:var(--text-danger)]">
                3 awaiting replay
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1.5 border-[color:var(--text-danger)]/30 bg-[color:var(--text-danger)]/12 py-1 pl-2 pr-2.5 text-[color:var(--text-danger)]"
            >
              <AlertOctagon className="h-3 w-3" />3 Failed
            </Badge>
            <button
              type="button"
              className="glass-surface glass-glow relative inline-flex items-center gap-1.5 rounded-lg border-0 px-3 py-1.5 text-[12px] font-medium text-white/85 transition hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Replay all
            </button>
          </div>
        </motion.div>

        {/* Dead letter table */}
        <motion.div variants={item}>
          <GlassCard tone="danger">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 px-6 pb-0 pt-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--text-danger)]/15 text-[color:var(--text-danger)] ring-1 ring-inset ring-[color:var(--text-danger)]/25">
                  <MailWarning className="h-4 w-4" />
                </div>
                <CardTitle className="font-display text-[14px] font-semibold text-white/90">
                  Failed Messages
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <FilterSelect
                  label="All queues"
                  options={["telegram.poi.ingest", "rest.ingest"]}
                />
                <FilterSelect
                  label="Not replayed"
                  options={["All", "Replayed"]}
                />
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-5">
              <div className="overflow-x-auto rounded-lg ring-1 ring-inset ring-white/10">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="bg-white/[0.02] text-[10px] uppercase tracking-[0.14em] text-white/45">
                      <th className="px-5 py-3.5 font-medium">ID</th>
                      <th className="px-5 py-3.5 font-medium">Queue</th>
                      <th className="px-5 py-3.5 font-medium">Error</th>
                      <th className="px-5 py-3.5 font-medium">Retries</th>
                      <th className="px-5 py-3.5 font-medium">Failed</th>
                      <th className="px-5 py-3.5 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {deadLetters.map((row, i) => (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.32,
                          delay: 0.25 + i * 0.06,
                          ease: "easeOut",
                        }}
                        className="border-t border-white/[0.06] transition hover:bg-white/[0.03]"
                      >
                        <td className="px-5 py-3.5 font-mono text-[11px] text-white/70">
                          {row.id}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-mono tracking-wide text-[10px] px-2 py-0.5",
                              toneBadgeVariant.neutral,
                            )}
                          >
                            {row.queue}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-[11.5px] text-[color:var(--text-danger)]">
                          {row.error}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[11.5px] tabular-nums text-[color:var(--text-warning)]">
                          {row.retries}
                        </td>
                        <td className="px-5 py-3.5 text-[11.5px] text-white/55">
                          {row.failed}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10.5px] font-medium text-white/75 transition hover:bg-white/[0.08] hover:text-white"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Replay
                          </button>
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
