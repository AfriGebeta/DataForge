"use client";

import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import { motion, type Variants } from "framer-motion";
import {
  FileCheck2,
  FileClock,
  FileCode2,
  Layers3,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DataTable, { type ColumnDef } from "@/components/ui/DataTable";
import { GlassCard } from "@/features/shared/GlassCard";
import { cn } from "@/lib/utils";

import { fetchChannels } from "../channels/api";
import { deleteWorkerSchema, fetchSchemas, updateWorkerSchema } from "./api";
import SchemaFormModal from "./SchemaFormModal";
import type { WorkerSchema } from "./types";

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

export default function SchemasPage() {
  const [schemas, setSchemas] = useState<WorkerSchema[]>([]);
  const [usedBy, setUsedBy] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WorkerSchema | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [schemaList, channelsRes] = await Promise.all([fetchSchemas(), fetchChannels()]);
    setSchemas(schemaList);

    const grouping: Record<string, string[]> = {};
    for (const ch of channelsRes.data) {
      if (!ch.expected_schema_id) continue;
      const label = ch.channel_name || ch.channel_id;
      grouping[ch.expected_schema_id] = [...(grouping[ch.expected_schema_id] ?? []), label];
    }
    setUsedBy(grouping);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleActive(ws: WorkerSchema) {
    await updateWorkerSchema(ws.id, { is_active: !ws.is_active });
    void load();
  }

  async function handleDelete(ws: WorkerSchema) {
    if (!window.confirm(`Delete schema "${ws.name} v${ws.version}"?`)) return;
    await deleteWorkerSchema(ws.id);
    void load();
  }

  const activeCount = schemas.filter((s) => s.is_active).length;
  const inactiveCount = schemas.length - activeCount;

  const kpis: { label: string; value: string; icon: ComponentType<{ className?: string }>; tone: Tone; delta: string }[] = [
    {
      label: "Total Schemas",
      value: schemas.length.toLocaleString(),
      icon: Layers3,
      tone: "accent",
      delta: `${new Set(schemas.map((s) => s.name)).size} distinct name(s)`,
    },
    {
      label: "Active",
      value: activeCount.toLocaleString(),
      icon: FileCheck2,
      tone: "success",
      delta: "validating live traffic",
    },
    {
      label: "Inactive",
      value: inactiveCount.toLocaleString(),
      icon: FileClock,
      tone: "warning",
      delta: "not enforced",
    },
  ];

  const columns: ColumnDef<WorkerSchema>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        size: 160,
        cell: ({ row }) => (
          <span className="font-mono text-[11.5px] font-medium text-white/90">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "version",
        header: "Version",
        size: 80,
        cell: ({ row }) => (
          <span className="font-mono text-[11.5px] tabular-nums text-white/70">v{row.original.version}</span>
        ),
      },
      {
        accessorKey: "is_active",
        header: "Status",
        size: 100,
        cell: ({ row }) => (
          <StatusBadge tone={row.original.is_active ? "success" : "warning"} fixed>
            {row.original.is_active ? "Active" : "Inactive"}
          </StatusBadge>
        ),
      },
      {
        id: "usedBy",
        header: "Used by channels",
        size: 220,
        cell: ({ row }) => (
          <span className="text-[11.5px] text-white/65">
            {(usedBy[row.original.id] ?? []).join(", ") || "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 130,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(row.original);
                setModalOpen(true);
              }}
              title="Edit"
              className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/[0.03] p-1.5 text-white/70 transition hover:bg-white/[0.08] hover:text-white"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void toggleActive(row.original);
              }}
              title={row.original.is_active ? "Deactivate" : "Activate"}
              className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/[0.03] p-1.5 text-white/70 transition hover:bg-white/[0.08] hover:text-white"
            >
              <Power className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void handleDelete(row.original);
              }}
              title="Delete"
              className="inline-flex items-center justify-center rounded-md border border-[color:var(--text-danger)]/25 bg-[color:var(--text-danger)]/10 p-1.5 text-[color:var(--text-danger)] transition hover:bg-[color:var(--text-danger)]/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [usedBy],
  );

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
                {activeCount} active · {inactiveCount} inactive
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="glass-surface glass-glow relative inline-flex items-center gap-1.5 rounded-lg border-0 px-3 py-1.5 text-[12px] font-medium text-white/85 transition hover:text-white"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
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
              <DataTable
                columns={columns}
                data={schemas}
                loading={loading}
                emptyMessage="No worker schemas registered yet."
              />
            </CardContent>
          </GlassCard>
        </motion.div>
      </motion.div>

      <SchemaFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => void load()}
        editing={editing}
      />
    </div>
  );
}
