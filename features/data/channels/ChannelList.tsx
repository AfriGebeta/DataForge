"use client";

import { useMemo } from "react";
import { Loader2, Pencil, Power, ServerCrash, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import DataTable, { type ColumnDef } from "@/components/ui/DataTable";
import { cn } from "@/lib/utils";

import type { ChannelConfig } from "./types";

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

function StatusBadge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-mono tracking-wide text-[10px] px-2 py-0.5", toneBadgeVariant[tone])}
    >
      {children}
    </Badge>
  );
}

function formatSchedule(ch: ChannelConfig): string {
  if (ch.schedule_type === "INTERVAL" && ch.poll_interval_sec) {
    return `INTERVAL ${ch.poll_interval_sec}s`;
  }
  if (ch.schedule_type === "CRON" && ch.cron_expr) {
    return `CRON ${ch.cron_expr}`;
  }
  return ch.schedule_type;
}

type Props = {
  channels: ChannelConfig[];
  loading: boolean;
  error: string | null;
  onEdit: (ch: ChannelConfig) => void;
  onToggleActive: (ch: ChannelConfig) => void;
  onDelete: (ch: ChannelConfig) => void;
};

export function ChannelList({ channels, loading, error, onEdit, onToggleActive, onDelete }: Props) {
  const columns: ColumnDef<ChannelConfig>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Channel",
        size: 220,
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-white/90">
              {row.original.channel_name || row.original.channel_id}
            </div>
            <div className="font-mono text-[10.5px] text-white/45">
              {row.original.default_message_type || "—"} · {row.original.default_language || "en"}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "channel",
        header: "Type",
        size: 140,
        cell: ({ row }) => <StatusBadge tone="accent">{row.original.channel}</StatusBadge>,
      },
      {
        id: "schedule",
        header: "Schedule",
        size: 150,
        cell: ({ row }) => (
          <span className="font-mono text-[11px] text-white/70">{formatSchedule(row.original)}</span>
        ),
      },
      {
        accessorKey: "is_active",
        header: "Status",
        size: 110,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <StatusBadge tone={row.original.is_active ? "success" : "warning"}>
              {row.original.is_active ? "Active" : "Inactive"}
            </StatusBadge>
            {row.original.is_trusted ? <StatusBadge tone="accent">Trusted</StatusBadge> : null}
          </div>
        ),
      },
      {
        accessorKey: "last_message_at",
        header: "Last msg",
        size: 140,
        cell: ({ row }) => (
          <span className="text-[11.5px] text-white/55">
            {row.original.last_message_at
              ? new Date(row.original.last_message_at).toLocaleString()
              : "Never"}
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
                onEdit(row.original);
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
                onToggleActive(row.original);
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
                onDelete(row.original);
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
    [onEdit, onToggleActive, onDelete],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2.5 py-12 text-[12px] text-white/55">
        <Loader2 className="h-4 w-4 animate-spin text-[color:var(--orange-400)]" />
        Loading channels…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center gap-2.5 rounded-lg border border-[color:var(--text-danger)]/25 bg-[color:var(--text-danger)]/[0.06] py-10 text-[12px] text-[color:var(--text-danger)]">
        <ServerCrash className="h-4 w-4" />
        Error: {error}
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={channels}
      emptyMessage="No channels configured yet."
    />
  );
}
