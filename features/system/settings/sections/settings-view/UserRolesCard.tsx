import { useRouter } from "next/navigation";
import type { AdminRole } from "../../types";

const ALL_ROLES: AdminRole[] = [
  "ADMIN",
  "DATA_EDITOR",
  "DATA_REVIEWER",
  "DATA_VALIDATOR",
  "VIEWER",
  "SERVICE_ACCOUNT",
];

type Props = {
  defaultRole: AdminRole;
  onRoleChange: (value: AdminRole) => void;
};

export default function UserRolesCard({ defaultRole, onRoleChange }: Props) {
  const router = useRouter();

  return (
    <div className="card">
      <div className="ch">
        <span className="ct">
          <i className="ti ti-shield-check" style={{ fontSize: 14, marginRight: 5 }} />
          User Roles
        </span>
        <button className="btn ghost sm" onClick={() => router.push("/system/users")}>
          Manage Team
        </button>
      </div>
      <div className="fg">
        <div className="fl">Default role for newly invited admins</div>
        <select
          value={defaultRole}
          onChange={(e) => onRoleChange(e.target.value as AdminRole)}
        >
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
