import type { TrustScoreWeight } from "../../types";

type Props = {
  weights: TrustScoreWeight[];
};

export default function TrustScoreWeightsCard({ weights }: Props) {
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="ch">
        <span className="ct">
          <i className="ti ti-scale" style={{ fontSize: 14, marginRight: 5 }} />
          Trust Score Weights
        </span>
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10 }}>
        Weights determining the composite reliability metric.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {weights.map((w) => (
          <div key={w.label}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                marginBottom: 3,
              }}
            >
              <span>{w.label}</span>
              <strong>{w.percent}%</strong>
            </div>
            <div className="pb">
              <div className="pbf" style={{ width: `${w.percent}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}