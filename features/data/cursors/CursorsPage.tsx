"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { ArrowUp, Loader2, MousePointer2, RefreshCw, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GlassCard } from "@/features/shared/GlassCard";
import { cn } from "@/lib/utils";

import { fetchChannels } from "../channels/api";
import type { ChannelConfig } from "../channels/types";
import { fetchCursorsForChannel, resetAllCursors, resetCursor, upsertCursor } from "./api";
import type { IngestCursor } from "./types";

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

function GlassInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-white/40">
        {label}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-[11.5px] text-white/85 outline-none transition placeholder:text-white/30 hover:bg-white/[0.06] focus:border-[color:var(--orange-400)]/40"
      />
    </div>
  );
}

export default function CursorsPage() {
  const [channels, setChannels] = useState<ChannelConfig[]>([]);
  const [channelId, setChannelId] = useState("");
  const [cursors, setCursors] = useState<IngestCursor[]>([]);
  const [loading, setLoading] = useState(true);

  const [advanceKey, setAdvanceKey] = useState("");
  const [advanceValue, setAdvanceValue] = useState("");
  const [advancing, setAdvancing] = useState(false);

  const loadChannels = useCallback(async () => {
    const res = await fetchChannels();
    setChannels(res.data);
    if (!channelId && res.data.length > 0) {
      setChannelId(res.data[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCursors = useCallback(async (id: string) => {
    if (!id) {
      setCursors([]);
      return;
    }
    setLoading(true);
    const res = await fetchCursorsForChannel(id);
    setCursors(res);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadChannels();
  }, [loadChannels]);

  useEffect(() => {
    void loadCursors(channelId);
  }, [channelId, loadCursors]);

  async function handleReset(cursorKey: string) {
    if (!channelId) return;
    await resetCursor(channelId, cursorKey);
    void loadCursors(channelId);
  }

  async function handleAdvance() {
    if (!channelId || !advanceKey.trim() || !advanceValue.trim()) return;
    setAdvancing(true);
    try {
      await upsertCursor(channelId, { cursor_key: advanceKey.trim(), cursor_value: advanceValue.trim() });
      setAdvanceKey("");
      setAdvanceValue("");
      void loadCursors(channelId);
    } finally {
      setAdvancing(false);
    }
  }

  const selectedChannel = channels.find((c) => c.id === channelId);

  return (
    <div
      className="view active relative min-h-full overflow-hidden bg-[color:var(--surface-0)] px-6 pt-10 pb-8 md:px-10 md:pt-14 md:pb-10 xl:px-14 xl:pt-16 xl:pb-12"
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
                {cursors.length} tracked position{cursors.length === 1 ? "" : "s"}
                {selectedChannel ? ` for ${selectedChannel.channel_name || selectedChannel.channel_id}` : ""}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              className="appearance-none rounded-lg border border-white/10 bg-white/[0.04] py-1.5 pl-3 pr-8 text-[11.5px] text-white/80 outline-none transition hover:bg-white/[0.07] focus:border-[color:var(--orange-400)]/40"
            >
              {channels.length === 0 ? <option value="">No channels configured</option> : null}
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.channel_name || c.channel_id}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void loadCursors(channelId)}
              className="glass-surface glass-glow relative inline-flex items-center gap-1.5 rounded-lg border-0 px-3 py-1.5 text-[12px] font-medium text-white/85 transition hover:text-white"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Refresh
            </button>
          </div>
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
              {cursors.length > 0 ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (!channelId) return;
                    if (!window.confirm("Reset ALL cursors for this channel? This forces a full re-ingest.")) return;
                    await resetAllCursors(channelId);
                    void loadCursors(channelId);
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-[color:var(--text-danger)]/30 bg-[color:var(--text-danger)]/12 px-2.5 py-1 text-[10.5px] font-medium text-[color:var(--text-danger)] transition hover:bg-[color:var(--text-danger)]/20"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset all
                </button>
              ) : null}
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-5">
              {loading ? (
                <div className="flex items-center justify-center gap-2.5 py-12 text-[12px] text-white/55">
                  <Loader2 className="h-4 w-4 animate-spin text-[color:var(--orange-400)]" />
                  Loading cursors…
                </div>
              ) : !channelId ? (
                <div className="py-10 text-center text-[12px] text-white/45">
                  Create a channel first — cursors are tracked per channel config.
                </div>
              ) : cursors.length === 0 ? (
                <div className="py-10 text-center text-[12px] text-white/45">
                  No cursors recorded yet for this channel.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg ring-1 ring-inset ring-white/10">
                  <table className="w-full text-left text-[12px]">
                    <thead>
                      <tr className="bg-white/[0.02] text-[10px] uppercase tracking-[0.14em] text-white/45">
                        <th className="px-5 py-3.5 font-medium">Cursor key</th>
                        <th className="px-5 py-3.5 font-medium">Value</th>
                        <th className="px-5 py-3.5 font-medium">Captured</th>
                        <th className="px-5 py-3.5 font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {cursors.map((row, i) => (
                        <motion.tr
                          key={row.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.32, delay: 0.15 + i * 0.06, ease: "easeOut" }}
                          className="border-t border-white/[0.06] transition hover:bg-white/[0.03]"
                        >
                          <td className="px-5 py-3.5 font-mono text-[11px] text-white/60">
                            {row.cursor_key}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-[11.5px] text-[color:var(--orange-400)] tabular-nums">
                            {row.cursor_value}
                          </td>
                          <td className="px-5 py-3.5 text-[11.5px] text-white/55">
                            {new Date(row.captured_at).toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => void handleReset(row.cursor_key)}
                              className="inline-flex items-center gap-1 rounded-md border border-[color:var(--text-danger)]/30 bg-[color:var(--text-danger)]/12 px-2 py-1 text-[10.5px] font-medium text-[color:var(--text-danger)] transition hover:bg-[color:var(--text-danger)]/20"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Reset
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
                className="font-mono text-[10px] tracking-wider bg-[color:var(--text-warning)]/12 text-[color:var(--text-warning)] border-[color:var(--text-warning)]/25"
              >
                ADMIN ONLY
              </Badge>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-white/40">
                    Channel
                  </label>
                  <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 font-mono text-[11.5px] text-white/70">
                    {selectedChannel ? selectedChannel.channel_name || selectedChannel.channel_id : "Select a channel above"}
                  </div>
                </div>
                <GlassInput
                  label="Cursor key"
                  placeholder="telegram_update_id"
                  value={advanceKey}
                  onChange={setAdvanceKey}
                />
                <GlassInput
                  label="New cursor value"
                  placeholder="99500"
                  value={advanceValue}
                  onChange={setAdvanceValue}
                />
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => void handleAdvance()}
                    disabled={advancing || !channelId || !advanceKey.trim() || !advanceValue.trim()}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[color:var(--orange-400)]/30 bg-[color:var(--orange-500)]/12 px-3 py-2 text-[11.5px] font-medium text-[color:var(--orange-400)] transition hover:bg-[color:var(--orange-500)]/20 disabled:pointer-events-none disabled:opacity-40"
                  >
                    {advancing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ArrowUp className="h-3.5 w-3.5" />
                    )}
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
