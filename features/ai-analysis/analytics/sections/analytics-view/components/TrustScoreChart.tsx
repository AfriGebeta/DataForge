import type { TrustScoreBar } from "../../../types";
import { GlassCard } from "@/features/shared/GlassCard";

type Props = {
  bars: TrustScoreBar[];
  delta: string;
  duplicateRate: number;
  duplicateDelta: string;
  reviewerProductivity: number;
  peakHours: string;
};

export default function TrustScoreChart({
  bars,
  delta,
  duplicateRate,
  duplicateDelta,
  reviewerProductivity,
  peakHours,
}: Props) {
  return (
    <div>
      <GlassCard flat className="card" style={{ marginBottom: 12 }}>
        <div className="ch">
          <span className="ct">Global Trust Score Trend</span>
          <span className="chip lo">↑ {delta}</span>
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            marginBottom: 10,
          }}
        >
          Trailing 90 days network reliability
        </div>
        <div
          style={{
            display: "flex",
            gap: 3,
            alignItems: "flex-end",
            height: 50,
          }}
        >
          {bars.map((bar, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                background: bar.is_accent
                  ? "var(--fill-accent)"
                  : "var(--surface-3)",
                borderRadius: "3px 3px 0 0",
                height: `${bar.height_percent}%`,
              }}
            />
          ))}
        </div>
      </GlassCard>

      <div className="g2" style={{ gap: 10, marginBottom: 0 }}>
        <GlassCard flat className="card">
          <div
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: ".05em",
              marginBottom: 4,
            }}
          >
            Duplicate Detection Rate
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            {duplicateRate.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-danger)" }}>
            ↓ {duplicateDelta}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
            Nodes flagged per 10k entities
          </div>
        </GlassCard>

        <GlassCard flat className="card-dark">
          <div
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: ".05em",
              marginBottom: 4,
            }}
          >
            Reviewer Productivity
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            {reviewerProductivity}{" "}
            <span
              style={{
                fontSize: 12,
                fontWeight: 400,
                color: "var(--text-muted)",
              }}
            >
              units/hr
            </span>
          </div>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-secondary)",
              marginTop: 2,
            }}
          >
            Human-in-loop throughput
          </div>
          <div
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              padding: "5px 8px",
              marginTop: 8,
              fontSize: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: "var(--text-muted)" }}>PEAK HOURS</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <strong>{peakHours}</strong>
              <i
                className="ti ti-bolt"
                style={{ color: "var(--text-warning)", fontSize: 12 }}
              />
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}