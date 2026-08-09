import type { AuditLogItem } from "../../types";
import ActorAvatar from "./ActorAvatar";
import StatusBadge from "./StatusBadge";

// Icon per known action prefix — a bounded, real vocabulary (the exact
// actions PlaceForge's system module actually records), not a per-row
// value invented by the backend.
const ACTION_ICONS: Record<string, string> = {
  "admin.login": "ti-key",
  "admin_user": "ti-users",
  "place.create": "ti-map-pin-plus",
  "place.update": "ti-map-pin",
  "place.review": "ti-checkbox",
  "place.refresh": "ti-refresh",
  "merge": "ti-git-merge",
  "flag": "ti-flag",
};

function actionIcon(action: string): string {
  const prefix = Object.keys(ACTION_ICONS).find((p) => action.startsWith(p));
  return prefix ? ACTION_ICONS[prefix] : "ti-activity";
}

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
            Chronological record of admin logins, place edits/reviews, merge
            decisions, and flag resolutions.
          </p>
        </div>
      </div>

      <div className="toolbar">
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
                  <th>Entity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="mono">{new Date(log.createdAt).toISOString()}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <ActorAvatar log={log} />
                        <span>{log.actorLabel}</span>
                      </div>
                    </td>
                    <td>
                      <i
                        className={`ti ${actionIcon(log.action)}`}
                        style={{ fontSize: 12, marginRight: 4, color: "var(--text-accent)" }}
                      />
                      {log.action}
                      {log.detail && (
                        <span style={{ color: "var(--text-muted)", marginLeft: 6 }}>
                          — {log.detail}
                        </span>
                      )}
                    </td>
                    <td className="mono">
                      {log.entityType && log.entityId ? `${log.entityType}:${log.entityId}` : "—"}
                    </td>
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
              Showing {logs.length === 0 ? 0 : (page - 1) * 25 + 1} to {(page - 1) * 25 + logs.length} of {total.toLocaleString()} results
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button
                  className="btn ghost sm"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page === 1}
                >
                  <i className="ti ti-chevron-left" />
                </button>
                <span>Page {page} of {Math.max(totalPages, 1)}</span>
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