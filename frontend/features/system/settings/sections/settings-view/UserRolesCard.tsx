type Props = {
  defaultRole: string;
  onRoleChange: (value: string) => void;
  onManageTeam: () => void;
};

export default function UserRolesCard({ defaultRole, onRoleChange, onManageTeam }: Props) {
  return (
    <div className="card">
      <div className="ch">
        <span className="ct">
          <i className="ti ti-shield-check" style={{ fontSize: 14, marginRight: 5 }} />
          User Roles
        </span>
        <button className="btn ghost sm" onClick={onManageTeam}>
          Manage Team
        </button>
      </div>
      <div className="fg">
        <div className="fl">Default permission for new domain accounts</div>
        <select
          value={defaultRole}
          onChange={(e) => onRoleChange(e.target.value)}
        >
          <option>Analyst (Read-only + Annotate)</option>
          <option>Reviewer (Read + Review)</option>
          <option>Admin (Full Access)</option>
        </select>
      </div>
    </div>
  );
}