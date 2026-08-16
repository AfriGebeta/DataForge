import type { AdminRole, SettingsData } from "../../types";
import AllowedLanguagesCard from "./AllowedLanguagesCard";
import OutdatedPlacesCard from "./OutdatedPlacesCard";
import UserRolesCard from "./UserRolesCard";

type Props = {
  data: SettingsData;
  onStaleDaysChange: (value: number) => void;
  onRoleChange: (value: AdminRole) => void;
  onAllowedLanguagesChange: (value: string[]) => void;
  onSave: () => void;
  onDiscard: () => void;
  saving: boolean;
  dirty: boolean;
};

export default function SettingsSection({
  data,
  onStaleDaysChange,
  onRoleChange,
  onAllowedLanguagesChange,
  onSave,
  onDiscard,
  saving,
  dirty,
}: Props) {
  return (
    <>
      <div className="page-hd">
        <h2>Platform Settings</h2>
        <p>Operational parameters this app actually reads and enforces.</p>
      </div>

      <div className="g2">
        <div>
          <OutdatedPlacesCard
            staleDaysThreshold={data.staleDaysThreshold}
            onChange={onStaleDaysChange}
          />
        </div>
        <div>
          <UserRolesCard
            defaultRole={data.defaultAdminRole}
            onRoleChange={onRoleChange}
          />
        </div>
        <div>
          <AllowedLanguagesCard
            allowedLanguages={data.allowedLanguages}
            onChange={onAllowedLanguagesChange}
          />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
        <button className="btn" onClick={onDiscard} disabled={!dirty || saving}>Discard Changes</button>
        <button className="btn p" onClick={onSave} disabled={!dirty || saving}>
          <i className="ti ti-check" />
          {saving ? "Saving..." : "Save Configuration"}
        </button>
      </div>
    </>
  );
}