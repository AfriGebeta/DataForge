"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Plus, Radio, RadioTower, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GlassCard } from "@/features/shared/GlassCard";
import { cn } from "@/lib/utils";

import { ChannelList } from "./ChannelList";
import ChannelFormModal from "./ChannelFormModal";
import { deleteChannelConfig, fetchChannels, updateChannelConfig } from "./api";
import type { ChannelConfig } from "./types";

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

export default function ChannelsPage() {
  const [channels, setChannels] = useState<ChannelConfig[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ChannelConfig | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchChannels();
      setChannels(res.data);
      setTotal(res.total);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load channels");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleActive(ch: ChannelConfig) {
    await updateChannelConfig(ch.id, { is_active: !ch.is_active });
    void load();
  }

  async function handleDelete(ch: ChannelConfig) {
    if (!window.confirm(`Delete channel "${ch.channel_name || ch.channel_id}"?`)) return;
    await deleteChannelConfig(ch.id);
    void load();
  }

  const activeCount = channels.filter((c) => c.is_active).length;

  return (
    <div
      className="view active relative min-h-full overflow-hidden bg-[color:var(--surface-0)] px-6 pt-10 pb-8 md:px-10 md:pt-14 md:pb-10 xl:px-14 xl:pt-16 xl:pb-12"
      id="v-channels"
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
                Live · Data › Ingestion Channels
              </span>
            </div>
            <h2 className="font-display-tight mt-2 text-[32px] font-semibold text-[color:var(--text-primary)]">
              Channels
            </h2>
            <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-[color:var(--text-muted)]">
              Configure and monitor data ingestion channels.
              <span className="ml-1 text-[color:var(--orange-400)]">
                {total} channel{total === 1 ? "" : "s"} configured
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1.5 border-[color:var(--text-success)]/25 bg-[color:var(--text-success)]/10 py-1 pl-2 pr-2.5 text-[color:var(--text-success)]"
            >
              <Radio className="h-3 w-3" />
              {activeCount} Active
            </Badge>
            <button
              type="button"
              onClick={() => void load()}
              className="glass-surface glass-glow relative inline-flex items-center gap-1.5 rounded-lg border-0 px-3 py-1.5 text-[12px] font-medium text-[color:var(--text-primary)] transition hover:text-[color:var(--text-primary)]"
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
              Create channel
            </button>
          </div>
        </motion.div>

        {/* Channel table */}
        <motion.div variants={item}>
          <GlassCard>
            <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--surface-2)] ring-1 ring-inset ring-[color:var(--border)]">
                  <RadioTower className="h-4 w-4 text-[color:var(--text-secondary)]" />
                </div>
                <CardTitle className="font-display text-[14px] font-semibold text-[color:var(--text-primary)]">
                  Configured Channels
                </CardTitle>
              </div>
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-[color:var(--text-muted)]">
                live config
              </span>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-5">
              <ChannelList
                channels={channels}
                loading={loading}
                error={error}
                onEdit={(ch) => {
                  setEditing(ch);
                  setModalOpen(true);
                }}
                onToggleActive={(ch) => void toggleActive(ch)}
                onDelete={(ch) => void handleDelete(ch)}
              />
            </CardContent>
          </GlassCard>
        </motion.div>
      </motion.div>

      <ChannelFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => void load()}
        editing={editing}
      />
    </div>
  );
}
