"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, MousePointerClick, ServerCrash } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { fetchChannels } from "./api";
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

function formatSchedule(ch: ChannelConfig): string {
  if (ch.schedule_type === "INTERVAL" && ch.poll_interval_sec) {
    return `INTERVAL ${ch.poll_interval_sec}s`;
  }
  if (ch.schedule_type === "CRON" && ch.cron_expr) {
    return `CRON ${ch.cron_expr}`;
  }
  return ch.schedule_type;
}

export function ChannelList() {
  const [channels, setChannels] = useState<ChannelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChannels()
      .then((data) => {
        setChannels(data.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch channels:", err); // Debug log
        setError(err.message);
        setLoading(false);
      });
  }, []);

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
    <div className="overflow-x-auto rounded-lg ring-1 ring-inset ring-white/10">
      <table className="w-full text-left text-[12px]">
        <thead>
          <tr className="bg-white/[0.02] text-[10px] uppercase tracking-[0.14em] text-white/45">
            <th className="px-5 py-3.5 font-medium">Channel</th>
            <th className="px-5 py-3.5 font-medium">Type</th>
            <th className="px-5 py-3.5 font-medium">Schedule</th>
            <th className="px-5 py-3.5 font-medium">Status</th>
            <th className="px-5 py-3.5 font-medium">Last msg</th>
            <th className="px-5 py-3.5 font-medium" />
          </tr>
        </thead>
        <tbody>
          {channels.map((ch, i) => (
            <motion.tr
              key={ch.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.32,
                delay: 0.25 + i * 0.06,
                ease: "easeOut",
              }}
              className="border-t border-white/[0.06] transition hover:bg-white/[0.03]"
            >
              <td className="px-5 py-3.5">
                <div className="font-medium text-white/90">
                  {ch.channel_name || ch.channel_id}
                </div>
                <div className="font-mono text-[10.5px] text-white/45">
                  {ch.default_message_type || "TEXT"} ·{" "}
                  {ch.default_language || "en"}
                </div>
              </td>
              <td className="px-5 py-3.5">
                <StatusBadge tone="accent">{ch.channel}</StatusBadge>
              </td>
              <td className="px-5 py-3.5 font-mono text-[11px] text-white/70">
                {formatSchedule(ch)}
              </td>
              <td className="px-5 py-3.5">
                <StatusBadge tone={ch.is_active ? "success" : "warning"}>
                  {ch.is_active ? "Active" : "Inactive"}
                </StatusBadge>
              </td>
              <td className="px-5 py-3.5 text-[11.5px] text-white/55">
                {ch.last_message_at
                  ? new Date(ch.last_message_at).toLocaleString()
                  : "Never"}
              </td>
              <td className="px-5 py-3.5 text-right">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/[0.03] p-1.5 text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                >
                  <MousePointerClick className="h-3.5 w-3.5" />
                </button>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
