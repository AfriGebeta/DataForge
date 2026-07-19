"use client";

import { useCallback, useEffect, useState } from "react";
import Toast from "@/components/custom/Toast";
import { useToast } from "@/hooks/useToast";
import { fetchRuns } from "../../api";
import type { RunStatus, RunsStats, WorkerRun } from "../../types";
import RunsSection from "./RunsSection";

const AVAILABLE_CHANNELS = ["@addis_poi_reports", "@addis_real_estate"];

export default function RunsPage() {
  const [runs, setRuns] = useState<WorkerRun[]>([]);
  const [stats, setStats] = useState<RunsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RunStatus | "">("");
  const [channelFilter, setChannelFilter] = useState("");
  const { message, visible, showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRuns({
        status: statusFilter || undefined,
        channel: channelFilter || undefined,
      });
      setRuns(res.data);
      setStats(res.stats);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load runs right now.",
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter, channelFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleStatusFilter = useCallback((status: RunStatus | "") => {
    setStatusFilter(status);
  }, []);

  const handleChannelFilter = useCallback((channel: string) => {
    setChannelFilter(channel);
  }, []);

  return (
    <div>
      {error && (
        <div
          style={{
            color: "var(--text-danger)",
            fontSize: 12,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      <RunsSection
        runs={runs}
        stats={stats}
        loading={loading}
        statusFilter={statusFilter}
        channelFilter={channelFilter}
        availableChannels={AVAILABLE_CHANNELS}
        onStatusFilter={handleStatusFilter}
        onChannelFilter={handleChannelFilter}
      />

      <Toast message={message} visible={visible} />
    </div>
  );
}