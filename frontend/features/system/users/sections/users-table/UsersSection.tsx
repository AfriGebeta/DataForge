import type { AdminRole, AdminUser } from "../../types";

type Props = {
  users: AdminUser[];
  loading: boolean;
  roleFilter: AdminRole | "";
  onRoleFilter: (role: AdminRole | "") => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
  onInvite: () => void;
  onEdit: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
};

const ROLES: AdminRole[] = [
  "ADMIN",
  "DATA_EDITOR",
  "DATA_REVIEWER",
  "DATA_VALIDATOR",
  "VIEWER",
  "SERVICE_ACCOUNT",
];

function RoleBadge({ role }: { role: AdminRole }) {
  const map: Record<AdminRole, string> = {
    ADMIN: "bx d",
    DATA_EDITOR: "bx a",
    DATA_REVIEWER: "bx w",
    DATA_VALIDATOR: "bx m",
    VIEWER: "bx m",
    SERVICE_ACCOUNT: "bx s",
  };
  return <span className={map[role]}>{role.replace(/_/g, " ")}</span>;
}

function formatLastLogin(iso: string | null): string {
  if (!iso) return "Never";
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function UsersSection({ users, loading, roleFilter, onRoleFilter, onToggleStatus, onInvite, onEdit, onDelete }: Props) {
  return (
    <>
      <div className="page-hd">
        <h2>Users</h2>
        <p>Manage admin user accounts and their roles.</p>
      </div>

      <div className="toolbar">
        <select value={roleFilter} onChange={(e) => onRoleFilter(e.target.value as AdminRole | "")} style={{ width: 160 }}>
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button className="btn p" style={{ marginLeft: "auto" }} onClick={onInvite}>
          <i className="ti ti-user-plus" />
          Invite user
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Loading...</p>
        ) : users.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>No users found.</p>
        ) : (
          <table>
            <colgroup>
              <col style={{ width: "16%" }} />
              <col style={{ width: "21%" }} />
              <col style={{ width: "17%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "8%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Full name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last login</th>
                <th />
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => onEdit(user)}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--glass-bg)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ""; }}
                >
                  <td style={{ fontWeight: 500 }}>
                    {user.fullName ?? <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>{user.email}</td>
                  <td><RoleBadge role={user.role} /></td>
                  <td>
                    {user.isActive
                      ? <span className="bx s">Active</span>
                      : <span className="bx w">Inactive</span>
                    }
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>{formatLastLogin(user.lastLoginAt)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {user.isActive ? (
                      <button className="btn sm d" onClick={() => onToggleStatus(user.id, false)}>Deactivate</button>
                    ) : (
                      <button className="btn sm" onClick={() => onToggleStatus(user.id, true)}>Activate</button>
                    )}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn sm ghost"
                      onClick={() => onDelete(user)}
                      aria-label="Delete user"
                      style={{ color: "var(--text-danger)", padding: "3px 6px" }}
                    >
                      <i className="ti ti-trash" style={{ fontSize: 14 }} />
                    </button>
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
