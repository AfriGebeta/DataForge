import type { RiskLevel, RiskSegment } from "../../../types";
import { GlassCard } from "@/features/shared/GlassCard";

type Props = {
  segments: RiskSegment[];
};

function levelFor(riskPercent: number): RiskLevel {
  if (riskPercent >= 50) return "HIGH_ALERT";
  if (riskPercent >= 20) return "ELEVATED";
  return "STABLE";
}

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

export default function RiskRanking({ segments }: Props) {
  return (
    <GlassCard flat className="card">
      <div className="ch">
        <span className="ct">Risk Ranking</span>
      </div>
      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          marginBottom: 10,
        }}
      >
        Share of each category still stuck in NEEDS_REVIEW
      </div>

      {segments.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>No places yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {segments.map((segment) => {
            const level = levelFor(segment.risk_percent);
            return (
              <div key={segment.name}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    marginBottom: 4,
                  }}
                >
                  <span>
                    {segment.name}{" "}
                    <span style={{ color: "var(--text-muted)" }}>
                      ({segment.needs_review}/{segment.total})
                    </span>
                  </span>
                  <RiskChip level={level} />
                </div>
                <div
                  className="risk-bar"
                  style={{
                    background: riskBarColor(level),
                    width: `${segment.risk_percent}%`,
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
