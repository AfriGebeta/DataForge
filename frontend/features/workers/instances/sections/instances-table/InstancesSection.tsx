import type { InstanceStatus, WorkerInstance } from "../../types";
import { GlassCard } from "@/features/shared/GlassCard";

type Props = {
  instances: WorkerInstance[];
  loading: boolean;
  statusFilter: InstanceStatus | "";
  onStatusFilter: (status: InstanceStatus | "") => void;
  onDrain: (id: string) => void;
  onStop: (id: string) => void;
  onSweep: () => void;
};

function StatusBadge({ status }: { status: InstanceStatus }) {
  if (status === "ALIVE")
    return (
      <>
        <span className="dot da" />
        <span className="bx s">Alive</span>
      </>
    );
  if (status === "DRAINING")
    return (
      <>
        <span className="dot dw" />
        <span className="bx w">Draining</span>
      </>
    );
  return (
    <>
      <span className="dot dd" />
      <span className="bx d">Dead</span>
    </>
  );
}

function formatHeartbeat(isoDate: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export default function InstancesSection({
  instances,
  loading,
  statusFilter,
  onStatusFilter,
  onDrain,
  onStop,
  onSweep,
}: Props) {
  return (
    <>
      <div className="page-hd">
        <h2>Worker Instances</h2>
        <p>Live status of running worker pods and their throughput.</p>
      </div>

      <div className="toolbar">
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilter(e.target.value as InstanceStatus | "")}
          style={{ width: 120 }}
        >
          <option value="">All statuses</option>
          <option value="ALIVE">ALIVE</option>
          <option value="DRAINING">DRAINING</option>
          <option value="DEAD">DEAD</option>
        </select>
        <button
          className="btn"
          style={{ marginLeft: "auto" }}
          onClick={onSweep}
        >
          <i className="ti ti-refresh" />
          Sweep stale
        </button>
      </div>

      <GlassCard flat className="card">
        {loading ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
            Loading...
          </p>
        ) : instances.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
            No instances found.
          </p>
        ) : (
          <table>
            <colgroup>
              <col style={{ width: "18%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "14%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Instance ID</th>
                <th>Worker</th>
                <th>Status</th>
                <th>Throughput</th>
                <th>Processed</th>
                <th>Last beat</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {instances.map((inst) => (
                <tr key={inst.id}>
                  <td className="mono">{inst.instance_id}</td>
                  <td>{inst.worker_name}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <StatusBadge status={inst.status} />
                    </div>
                  </td>
                  <td>
                    {inst.status !== "DEAD"
                      ? `${inst.throughput_per_min}/min`
                      : "—"}
                  </td>
                  <td>{inst.processed_count.toLocaleString()}</td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {formatHeartbeat(inst.last_heartbeat_at)}
                  </td>
                  <td>
                    {inst.status === "DEAD" ? (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    ) : (
                      <div className="row-act">
                        {inst.status === "ALIVE" && (
                          <button
                            className="btn sm"
                            onClick={() => onDrain(inst.id)}
                          >
                            Drain
                          </button>
                        )}
                        <button
                          className="btn sm d"
                          onClick={() => onStop(inst.id)}
                        >
                          Stop
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>
    </>
  );
}