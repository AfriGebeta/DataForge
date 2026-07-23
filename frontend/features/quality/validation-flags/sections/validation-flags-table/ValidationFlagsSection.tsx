import type {
  FlagCategory,
  FlagSeverity,
  FlagStats,
  FlagStatusFilter,
  ValidationFlag,
} from "../../types";
import SeverityBadge from "./SeverityBadge";
import { GlassCard } from "@/features/shared/GlassCard";
type Props = {
  flags: ValidationFlag[];
  stats: FlagStats | null;
  loading: boolean;
  categoryFilter: FlagCategory | "";
  severityFilter: FlagSeverity | "";
  statusFilter: FlagStatusFilter;
  onCategoryFilter: (value: FlagCategory | "") => void;
  onSeverityFilter: (value: FlagSeverity | "") => void;
  onStatusFilter: (value: FlagStatusFilter) => void;
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateFlag: () => void;
  onBulkResolve: () => void;
};

export default function ValidationFlagsSection({
  flags,
  stats,
  loading,
  categoryFilter,
  severityFilter,
  statusFilter,
  onCategoryFilter,
  onSeverityFilter,
  onStatusFilter,
  onResolve,
  onDelete,
  onCreateFlag,
  onBulkResolve,
}: Props) {
  return (
    <>
      <div className="page-hd">
        <h2>Validation Flags</h2>
        <p>Open data quality issues requiring resolution.</p>
      </div>

      {stats && (
        <div className="g4" style={{ marginBottom: 14 }}>
          <GlassCard flat className="mc">
            <div className="ml">Critical</div>
            <div className="mv" style={{ color: "var(--text-danger)" }}>{stats.critical}</div>
          </GlassCard>
          <GlassCard flat className="mc">
            <div className="ml">Error</div>
            <div className="mv" style={{ color: "var(--text-danger)" }}>{stats.error}</div>
          </GlassCard>
          <GlassCard flat className="mc">
            <div className="ml">Warning</div>
            <div className="mv" style={{ color: "var(--text-warning)" }}>{stats.warning}</div>
          </GlassCard>
          <GlassCard flat className="mc">
            <div className="ml">Info</div>
            <div className="mv" style={{ color: "var(--text-accent)" }}>{stats.info}</div>
          </GlassCard>
        </div>
      )}

      <div className="toolbar">
        <select value={categoryFilter} onChange={(e) => onCategoryFilter(e.target.value as FlagCategory | "")} style={{ width: 120 }}>
          <option value="">All categories</option>
          <option value="GEOMETRY">GEOMETRY</option>
          <option value="ADDRESS">ADDRESS</option>
          <option value="NAME">NAME</option>
          <option value="HIERARCHY">HIERARCHY</option>
          <option value="CONTACT">CONTACT</option>
          <option value="FRESHNESS">FRESHNESS</option>
          <option value="CONSISTENCY">CONSISTENCY</option>
        </select>

        <select value={severityFilter} onChange={(e) => onSeverityFilter(e.target.value as FlagSeverity | "")} style={{ width: 110 }}>
          <option value="">All severities</option>
          <option value="CRITICAL">CRITICAL</option>
          <option value="ERROR">ERROR</option>
          <option value="WARNING">WARNING</option>
          <option value="INFO">INFO</option>
        </select>

        <select value={statusFilter} onChange={(e) => onStatusFilter(e.target.value as FlagStatusFilter)} style={{ width: 110 }}>
          <option value="unresolved">Unresolved</option>
          <option value="all">All</option>
          <option value="resolved">Resolved</option>
        </select>

        <button className="btn p" style={{ marginLeft: "auto" }} onClick={onCreateFlag}>
          <i className="ti ti-plus" />
          Create flag
        </button>
        <button className="btn" onClick={onBulkResolve}>
          <i className="ti ti-check" />
          Bulk resolve
        </button>
      </div>

      <GlassCard flat className="card">
        {loading ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Loading...</p>
        ) : flags.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>No flags found.</p>
        ) : (
          <table>
            <colgroup>
              <col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "26%" }} />
              <col style={{ width: "16%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Place ID</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Flag code</th>
                <th>Message</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {flags.map((flag) => (
                <tr key={flag.id}>
                  <td className="mono">{flag.place_id}</td>
                  <td><span className="tag">{flag.category}</span></td>
                  <td><SeverityBadge severity={flag.severity} /></td>
                  <td className="mono" style={{ fontSize: 10 }}>{flag.flag_code}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{flag.message}</td>
                  <td>
                    <div className="row-act">
                      {!flag.is_resolved && (
                        <button className="btn sm" onClick={() => onResolve(flag.id)}>Resolve</button>
                      )}
                      <button className="btn sm d" onClick={() => onDelete(flag.id)}>Delete</button>
                    </div>
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