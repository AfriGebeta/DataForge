"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchChannels } from "@/features/data/channels/api";
import type { ChannelConfig } from "@/features/data/channels/types";
import { fetchRunStats, fetchRuns } from "../../api";
import type { RunStats, RunStatus, WorkerRun } from "../../types";
import RunsSection from "./RunsSection";

export default function RunsPage() {
  const [runs, setRuns] = useState<WorkerRun[]>([]);
  const [stats, setStats] = useState<RunStats | null>(null);
  const [channels, setChannels] = useState<ChannelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RunStatus | "">("");
  const [channelFilter, setChannelFilter] = useState("");

  useEffect(() => {
    fetchChannels({ limit: 200 })
      .then((res) => setChannels(res.data))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [runsRes, statsRes] = await Promise.all([
        fetchRuns({
          status: statusFilter || undefined,
          channelConfigId: channelFilter || undefined,
        }),
        fetchRunStats(channelFilter || undefined),
      ]);
      setRuns(runsRes.data);
      setStats(statsRes);
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

  const handleChannelFilter = useCallback((channelId: string) => {
    setChannelFilter(channelId);
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
        channels={channels}
        onStatusFilter={handleStatusFilter}
        onChannelFilter={handleChannelFilter}
      />
    </div>
  );
}
