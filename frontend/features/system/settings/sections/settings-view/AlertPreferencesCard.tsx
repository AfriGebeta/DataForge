import type { AlertPreference } from "../../types";

type Props = {
  preferences: AlertPreference[];
  onToggle: (id: string) => void;
};

export default function AlertPreferencesCard({ preferences, onToggle }: Props) {
  return (
    <div className="card">
      <div className="ch">
        <span className="ct">
          <i className="ti ti-bell" style={{ fontSize: 14, marginRight: 5 }} />
          Alert Preferences
        </span>
      </div>
      <div className="pref-list">
        {preferences.map((pref) => (
          <label key={pref.id} className="pref-check">
            <input
              type="checkbox"
              checked={pref.enabled}
              onChange={() => onToggle(pref.id)}
            />
            <span>{pref.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}