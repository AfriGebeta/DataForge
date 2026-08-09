import { GlassCard } from "@/features/shared/GlassCard";

export default function DecisionExplainer() {
  return (
    <GlassCard flat className="card">
      <div className="ch">
        <span className="ct">Decision Explainer: Score Reduction Example</span>
      </div>
      <div className="g2" style={{ gap: 8, marginBottom: 10 }}>
        <GlassCard flat className="card" style={{ borderRadius: 8, padding: 10 }}>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: ".05em",
              marginBottom: 4,
            }}
          >
            Input Entity A
          </div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>"Cafe Mocha"</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            LAT: 40.7128, LNG: -74.0060
          </div>
        </GlassCard>
        <GlassCard flat className="card" style={{ borderRadius: 8, padding: 10 }}>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: ".05em",
              marginBottom: 4,
            }}
          >
            Input Entity B
          </div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>"Moka Cafe"</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            LAT: 40.7130, LNG: -74.0065
          </div>
        </GlassCard>
      </div>
      <GlassCard flat className="card-dark" style={{ borderRadius: 8, padding: 10 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          <span>Inference Log</span>
          <span style={{ color: "var(--text-accent)" }}>Match Score: 68%</span>
        </div>
        <div className="log-entry log-info">
          [INFO] Name similarity (Jaro-Winkler) = 0.82. High correlation.
        </div>
        <div className="log-entry log-info">
          [INFO] Spatial distance = 45 meters. Within dense urban threshold.
        </div>
        <div className="log-entry log-warn">
          [WARN] Category conflict detected: Entity A (Cafe), Entity B
          (Retail/Coffee Equipment).
        </div>
        <div className="log-entry log-err" style={{ border: "none" }}>
          ⇒ Penalty applied: -0.25 due to category mismatch. Review flagged.
        </div>
      </GlassCard>
    </GlassCard>
  );
}