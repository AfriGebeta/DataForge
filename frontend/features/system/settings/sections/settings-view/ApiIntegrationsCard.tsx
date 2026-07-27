import type { ApiIntegration } from "../../types";

type Props = {
  integrations: ApiIntegration[];
  onToggle: (id: string) => void;
  onRenew: (id: string) => void;
};

export default function ApiIntegrationsCard({ integrations, onToggle, onRenew }: Props) {
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="ch">
        <span className="ct">
          <i className="ti ti-plug" style={{ fontSize: 14, marginRight: 5 }} />
          API Integrations
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {integrations.map((integration) => (
          <div
            key={integration.id}
            style={{
              background: "var(--surface-2)",
              border: `1px solid ${integration.status === "expired" ? "rgba(248,113,113,0.2)" : "var(--border)"}`,
              borderRadius: 8,
              padding: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: "var(--surface-3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i className={`ti ${integration.icon}`} style={{ fontSize: 14 }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{integration.name}</div>
                <div
                  style={{
                    fontSize: 10,
                    color: integration.status === "connected"
                      ? "var(--text-success)"
                      : "var(--text-danger)",
                  }}
                >
                  {integration.status === "connected" ? "Connected" : "Auth Expired"}
                </div>
              </div>
            </div>

            {integration.status === "expired" ? (
              <button className="btn sm p" onClick={() => onRenew(integration.id)}>
                RENEW
              </button>
            ) : (
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={integration.enabled}
                  onChange={() => onToggle(integration.id)}
                />
                <span className="toggle-track" />
                <span className="toggle-thumb" />
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}