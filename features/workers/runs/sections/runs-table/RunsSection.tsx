import type { ChannelConfig } from "@/features/data/channels/types";
import type { RunStats, RunStatus, WorkerRun } from "../../types";
import { GlassCard } from "@/features/shared/GlassCard";

type Props = {
  runs: WorkerRun[];
  stats: RunStats | null;
  loading: boolean;
  statusFilter: RunStatus | "";
  channelFilter: string;
  channels: ChannelConfig[];
  onStatusFilter: (status: RunStatus | "") => void;
  onChannelFilter: (channelId: string) => void;
};

function StatusBadge({ status }: { status: RunStatus }) {
  const map: Record<RunStatus, string> = {
    SUCCESS: "bx s",
    FAILED: "bx d",
    RUNNING: "bx a",
    TIMEOUT: "bx w",
  };
  return <span className={map[status]}>{status}</span>;
}

function formatDuration(run: WorkerRun): string {
  if (!run.finished_at) return "—";
  const seconds =
    (new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000;
  return `${seconds.toFixed(1)}s`;
}

export default function RunsSection({
  runs,
  stats,
  loading,
  statusFilter,
  channelFilter,
  channels,
  onStatusFilter,
  onChannelFilter,
}: Props) {
  const channelName = (id: string) => {
    const channel = channels.find((c) => c.id === id);
    return channel?.channel_name || channel?.channel_id || id.slice(0, 8);
  };
  const successRate = stats && stats.total_runs > 0
    ? ((stats.success_runs / stats.total_runs) * 100).toFixed(1)
    : "0.0";

  return (
    <>
      <div className="page-hd">
        <h2>Worker Runs</h2>
        <p>Historical and live run records with cursor progression.</p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="g4" style={{ marginBottom: 14 }}>
          <GlassCard flat className="mc">
            <div className="ml">Total Runs</div>
            <div className="mv">{stats.total_runs.toLocaleString()}</div>
          </GlassCard>
          <GlassCard flat className="mc">
            <div className="ml">Success Rate</div>
            <div className="mv" style={{ color: "var(--text-success)" }}>
              {successRate}%
            </div>
          </GlassCard>
          <GlassCard flat className="mc">
            <div className="ml">Total Ingested</div>
            <div className="mv">{stats.total_ingested.toLocaleString()}</div>
          </GlassCard>
          <GlassCard flat className="mc">
            <div className="ml">Avg Duration</div>
            <div className="mv">{stats.avg_duration_sec.toFixed(1)}s</div>
          </GlassCard>
        </div>
      )}

      {/* Filters */}
      <div className="toolbar">
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilter(e.target.value as RunStatus | "")}
          style={{ width: 140 }}
        >
          <option value="">All statuses</option>
          <option value="RUNNING">RUNNING</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILED">FAILED</option>
          <option value="TIMEOUT">TIMEOUT</option>
        </select>

        <select
          value={channelFilter}
          onChange={(e) => onChannelFilter(e.target.value)}
          style={{ width: 200 }}
        >
          <option value="">All channels</option>
          {channels.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.channel_name || ch.channel_id}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <GlassCard flat className="card">
        {loading ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
            Loading...
          </p>
        ) : runs.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
            No runs found.
          </p>
        ) : (
          <table>
            <colgroup>
              <col style={{ width: "10%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "21%" }} />
              <col style={{ width: "11%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Run ID</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Ingested</th>
                <th>Dupes</th>
                <th>Failed</th>
                <th>Cursor before → after</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id}>
                  <td className="mono">{run.id.slice(0, 8)}…</td>
                  <td>{channelName(run.channel_config_id)}</td>
                  <td>
                    <StatusBadge status={run.status} />
                  </td>
                  <td>{run.ingested_count}</td>
                  <td>{run.duplicate_count}</td>
                  <td>{run.failed_count}</td>
                  <td className="mono">
                    {run.cursor_before ?? "…"} → {run.cursor_after ?? "…"}
                  </td>
                  <td>{formatDuration(run)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>
    </>
  );
}
