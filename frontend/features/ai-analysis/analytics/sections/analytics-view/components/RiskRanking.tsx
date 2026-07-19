import type { RiskLevel, RiskZone } from "../../../types";

type Props = {
  zones: RiskZone[];
  onViewRegistry: () => void;
};

function RiskChip({ level }: { level: RiskLevel }) {
  if (level === "HIGH_ALERT") return <span className="chip hi">High Alert</span>;
  if (level === "ELEVATED") return <span className="chip md">Elevated</span>;
  return <span className="chip lo">Stable</span>;
}

function riskBarColor(level: RiskLevel): string {
  if (level === "HIGH_ALERT") return "var(--text-danger)";
  if (level === "ELEVATED") return "var(--text-warning)";
  return "var(--text-success)";
}

export default function RiskRanking({ zones, onViewRegistry }: Props) {
  return (
    <div className="card">
      <div className="ch">
        <span className="ct">Risk Ranking</span>
        <button className="btn ghost sm">
          <i className="ti ti-dots" />
        </button>
      </div>
      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          marginBottom: 10,
        }}
      >
        Geographic anomaly zones
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {zones.map((zone) => (
          <div key={zone.name}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                marginBottom: 4,
              }}
            >
              <span>{zone.name}</span>
              <RiskChip level={zone.level} />
            </div>
            <div
              className="risk-bar"
              style={{
                background: riskBarColor(zone.level),
                width: `${zone.width_percent}%`,
              }}
            />
          </div>
        ))}
      </div>

      <button
        className="btn"
        style={{ width: "100%", justifyContent: "center", marginTop: 12 }}
        onClick={onViewRegistry}
      >
        View Full Registry
      </button>
    </div>
  );
}