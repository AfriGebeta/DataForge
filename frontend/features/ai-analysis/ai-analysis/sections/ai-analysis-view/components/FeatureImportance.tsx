import type { FeatureImportance as FeatureImportanceType } from "../../../types";

type Props = {
  items: FeatureImportanceType[];
};

export default function FeatureImportance({ items }: Props) {
  return (
    <div className="card">
      <div className="ch">
        <span className="ct">Feature Importance Attribution</span>
        <button className="btn ghost sm">
          <i className="ti ti-dots-vertical" />
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((f) => (
          <div key={f.name}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                marginBottom: 3,
              }}
            >
              <span>{f.name}</span>
              <strong>{f.score}</strong>
            </div>
            <div className="pb">
              <div
                className="pbf"
                style={{
                  width: `${f.width_percent}%`,
                  background: f.color ?? "var(--fill-accent)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}