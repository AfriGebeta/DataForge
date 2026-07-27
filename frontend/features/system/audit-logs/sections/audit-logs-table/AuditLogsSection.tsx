import type { AuditLogItem } from "../../types";
import ActorAvatar from "./ActorAvatar";
import StatusBadge from "./StatusBadge";

type Props = {
  logs: AuditLogItem[];
  loading: boolean;
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  onExport: () => void;
};

export default function AuditLogsSection({
  logs,
  loading,
  total,
  page,
  onPageChange,
  onExport,
}: Props) {
  const totalPages = Math.ceil(total / 25);

  return (
    <>
      <div
        className="page-hd"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <div>
          <h2>System Audit Logs</h2>
          <p>
            Comprehensive chronological record of all system, AI, and human
            actions affecting spatial data integrity. Retained for 90 days for
            compliance.
          </p>
        </div>
      </div>

      <div className="toolbar">
        <button className="btn sm">
          <i className="ti ti-calendar" />
          Oct 24, 2023 – Oct 25, 2023
        </button>
        <button className="btn sm">
          <i className="ti ti-adjustments" />
          Action Type ▾
        </button>
        <button className="btn sm">
          <i className="ti ti-user" />
          User / System ▾
        </button>
        <button className="btn sm" style={{ marginLeft: "auto" }} onClick={onExport}>
          <i className="ti ti-download" />
          Export CSV
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Loading...</p>
        ) : (
          <>
            <table>
              <colgroup>
                <col style={{ width: "22%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "16%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Timestamp (UTC)</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity ID</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="mono">{log.timestamp}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <ActorAvatar log={log} />
                        <span>{log.actor}</span>
                      </div>
                    </td>
                    <td>
                      <i
                        className={`ti ${log.action_icon}`}
                        style={{
                          fontSize: 12,
                          marginRight: 4,
                          color: log.action_icon_color,
                        }}
                      />
                      {log.action}
                    </td>
                    <td className="mono">{log.entity_id}</td>
                    <td><StatusBadge status={log.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 12,
                fontSize: 11,
                color: "var(--text-muted)",
              }}
            >
              Showing 1 to {logs.length} of {total.toLocaleString()} results
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button
                  className="btn ghost sm"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page === 1}
                >
                  <i className="ti ti-chevron-left" />
                </button>
                {[1, 2, 3].map((p) => (
                  <button
                    key={p}
                    className={`btn sm${page === p ? " p" : " ghost"}`}
                    onClick={() => onPageChange(p)}
                  >
                    {p}
                  </button>
                ))}
                <span>…</span>
                <button
                  className="btn ghost sm"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages}
                >
                  <i className="ti ti-chevron-right" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}