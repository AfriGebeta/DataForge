import type { SettingsData } from "../../types";
import AiThresholdCard from "./AiThresholdCard";
import AlertPreferencesCard from "./AlertPreferencesCard";
import ApiIntegrationsCard from "./ApiIntegrationsCard";
import ModelSelectionCard from "./ModelSelectionCard";
import TrustScoreWeightsCard from "./TrustScoreWeightsCard";
import UserRolesCard from "./UserRolesCard";

type Props = {
  data: SettingsData;
  onSensitivityChange: (value: number) => void;
  onMaxThreadsChange: (value: number) => void;
  onInferenceTimeoutChange: (value: number) => void;
  onModelSelect: (id: string) => void;
  onRoleChange: (value: string) => void;
  onManageTeam: () => void;
  onIntegrationToggle: (id: string) => void;
  onIntegrationRenew: (id: string) => void;
  onAlertToggle: (id: string) => void;
  onSave: () => void;
  onDiscard: () => void;
};

export default function SettingsSection({
  data,
  onSensitivityChange,
  onMaxThreadsChange,
  onInferenceTimeoutChange,
  onModelSelect,
  onRoleChange,
  onManageTeam,
  onIntegrationToggle,
  onIntegrationRenew,
  onAlertToggle,
  onSave,
  onDiscard,
}: Props) {
  return (
    <>
      <div className="page-hd">
        <h2>Platform Settings</h2>
        <p>
          Configure analytical thresholds, model integrations, and operational
          parameters for the cartographic intelligence engine.
        </p>
      </div>

      <div className="g2">
        <div>
          <AiThresholdCard
            sensitivity={data.anomaly_sensitivity}
            maxThreads={data.max_threads}
            inferenceTimeout={data.inference_timeout_ms}
            onSensitivityChange={onSensitivityChange}
            onMaxThreadsChange={onMaxThreadsChange}
            onInferenceTimeoutChange={onInferenceTimeoutChange}
          />
          <ModelSelectionCard
            models={data.models}
            onSelect={onModelSelect}
          />
          <UserRolesCard
            defaultRole={data.default_role}
            onRoleChange={onRoleChange}
            onManageTeam={onManageTeam}
          />
        </div>

        <div>
          <TrustScoreWeightsCard weights={data.trust_weights} />
          <ApiIntegrationsCard
            integrations={data.integrations}
            onToggle={onIntegrationToggle}
            onRenew={onIntegrationRenew}
          />
          <AlertPreferencesCard
            preferences={data.alert_preferences}
            onToggle={onAlertToggle}
          />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
        <button className="btn" onClick={onDiscard}>Discard Changes</button>
        <button className="btn p" onClick={onSave}>
          <i className="ti ti-check" />
          Save Configuration
        </button>
      </div>
    </>
  );
}