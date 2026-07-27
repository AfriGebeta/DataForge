import type { BusinessClaim, ClaimStatus } from "../../types";

type Props = {
  claims: BusinessClaim[];
  loading: boolean;
  statusFilter: ClaimStatus | "";
  onStatusFilter: (status: ClaimStatus | "") => void;
  onRefresh: () => void;
  onDetail: (claim: BusinessClaim) => void;
  onApprove: (claim: BusinessClaim) => void;
  onReject: (claim: BusinessClaim) => void;
  onCancel: (claim: BusinessClaim) => void;
};

const STATUSES: ClaimStatus[] = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

function StatusBadge({ status }: { status: ClaimStatus }) {
  const map: Record<ClaimStatus, string> = {
    PENDING: "bx w",
    APPROVED: "bx s",
    REJECTED: "bx d",
    CANCELLED: "bx m",
  };
  return <span className={map[status]}>{status}</span>;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ClaimsSection({
  claims, loading, statusFilter, onStatusFilter,
  onRefresh, onDetail, onApprove, onReject, onCancel,
}: Props) {
  return (
    <>
      <div className="page-hd">
        <h2>Business Claims</h2>
        <p>Review and manage place ownership claims submitted by business owners.</p>
      </div>

      <div className="toolbar">
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilter(e.target.value as ClaimStatus | "")}
          style={{ width: 150 }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button className="btn" style={{ marginLeft: "auto" }} onClick={onRefresh}>
          <i className="ti ti-refresh" />
          Refresh
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Loading...</p>
        ) : claims.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>No claims found.</p>
        ) : (
          <table>
            <colgroup>
              <col style={{ width: "20%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "36%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Business</th>
                <th>Claimant</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => (
                <tr
                  key={claim.id}
                  onClick={() => onDetail(claim)}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--glass-bg)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ""; }}
                >
                  <td style={{ fontWeight: 500 }}>
                    {claim.placeName ?? <span style={{ color: "var(--text-muted)" }}>{claim.placeId}</span>}
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>
                    {claim.userFullName ?? claim.userEmail ?? "—"}
                  </td>
                  <td><StatusBadge status={claim.status} /></td>
                  <td style={{ color: "var(--text-muted)" }}>{formatDate(claim.createdAt)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {claim.status === "PENDING" ? (
                      <div className="row-act">
                        <button className="btn sm p" onClick={() => onApprove(claim)}>
                          <i className="ti ti-check" />
                          Approve
                        </button>
                        <button className="btn sm d" onClick={() => onReject(claim)}>
                          Reject
                        </button>
                        <button className="btn sm ghost" onClick={() => onCancel(claim)} style={{ color: "var(--text-muted)" }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: 11 }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
