"use client";

import { useState, useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import { ArrowUp, MousePointer2, RotateCcw } from "lucide-react";
import DataTable, { type ColumnDef } from "@/components/ui/DataTable";
import { fetchCursors } from "./api";
import type { IngestCursor } from "./types";

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

const columns: ColumnDef<IngestCursor>[] = [
  {
    accessorKey: "channel_config_id",
    header: "Channel",
    cell: ({ row }) => (
      <span className="font-medium text-white/90">
        {row.getValue<string>("channel_config_id")}
      </span>
    ),
  },
  {
    accessorKey: "cursor_key",
    header: "Cursor key",
    cell: ({ row }) => (
      <span className="font-mono text-[11px] text-white/60">
        {row.getValue<string>("cursor_key")}
      </span>
    ),
  },
  {
    accessorKey: "cursor_value",
    header: "Value",
    cell: ({ row }) => (
      <span className="font-mono text-[11.5px] text-[color:var(--orange-400)] tabular-nums">
        {row.getValue<string>("cursor_value")}
      </span>
    ),
  },
  {
    accessorKey: "captured_at",
    header: "Captured",
    cell: ({ row }) => {
      const dateStr = row.getValue<string>("captured_at");
      const formatted = dateStr ? new Date(dateStr).toLocaleString() : "Unknown";
      return <span className="text-[11.5px] text-white/55">{formatted}</span>;
    },
  },
  {
    id: "actions",
    header: "",
    cell: () => (
      <div className="text-right">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border border-[color:var(--text-danger)]/30 bg-[color:var(--text-danger)]/12 px-2 py-1 text-[10.5px] font-medium text-[color:var(--text-danger)] transition hover:bg-[color:var(--text-danger)]/20"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>
    ),
  },
];

function GlassInput({
  label,
  placeholder,
  defaultValue,
}: {
  label: string;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-white/40">
        {label}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-[11.5px] text-white/85 outline-none transition placeholder:text-white/30 hover:bg-white/[0.06] focus:border-[color:var(--orange-400)]/40"
      />
    </div>
  );
}

export default function CursorsPage() {
  const [data, setData] = useState<IngestCursor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const response = await fetchCursors();
        setData(response.items || []);
      } catch (error) {
        console.error("Error fetching cursors", error);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);

  return (
    <div
      className="view active relative min-h-full overflow-y-auto bg-[color:var(--surface-0)] px-6 pt-10 pb-8 md:px-10 md:pt-14 md:pb-10 xl:px-14 xl:pt-16 xl:pb-12"
      id="v-cursors"
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
                Live · Data › Resume Watermarks
              </span>
            </div>
            <h2 className="font-display-tight mt-2 text-[32px] font-semibold text-white">
              Cursors
            </h2>
            <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/55">
              Cursor watermarks — workers resume from these on restart.
              <span className="ml-1 text-[color:var(--orange-400)]">
                4 tracked positions
              </span>
            </p>
          </div>

          <Badge
            variant="outline"
            className="gap-1.5 border-[color:var(--text-success)]/25 bg-[color:var(--text-success)]/10 py-1 pl-2 pr-2.5 text-[color:var(--text-success)]"
          >
            <MousePointer2 className="h-3 w-3" />
            All cursors healthy
          </Badge>
        </motion.div>

        {/* Cursor table */}
        <motion.div variants={item}>
          <GlassCard>
            <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 ring-1 ring-inset ring-white/10">
                  <MousePointer2 className="h-4 w-4 text-white/75" />
                </div>
                <CardTitle className="font-display text-[14px] font-semibold text-white/90">
                  Cursor Watermarks
                </CardTitle>
              </div>
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-white/45">
                per channel
              </span>
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

        {/* Advance cursor manually */}
        <motion.div variants={item}>
          <GlassCard tone="accent">
            <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--orange-500)]/15 text-[color:var(--orange-400)] ring-1 ring-inset ring-[color:var(--orange-400)]/25">
                  <ArrowUp className="h-4 w-4" />
                </div>
                <CardTitle className="font-display text-[14px] font-semibold text-white/90">
                  Advance Cursor Manually
                </CardTitle>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "font-mono text-[10px] tracking-wider",
                  toneBadgeVariant.warning,
                )}
              >
                ADMIN ONLY
              </Badge>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <GlassInput
                  label="Channel config ID"
                  placeholder="xxxxxxxx-xxxx-…"
                />
                <GlassInput
                  label="Cursor key"
                  defaultValue="telegram_update_id"
                />
                <GlassInput label="New cursor value" placeholder="99500" />
                <div className="flex items-end">
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[color:var(--orange-400)]/30 bg-[color:var(--orange-500)]/12 px-3 py-2 text-[11.5px] font-medium text-[color:var(--orange-400)] transition hover:bg-[color:var(--orange-500)]/20"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                    Advance
                  </button>
                </div>
              </div>
            </CardContent>
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
