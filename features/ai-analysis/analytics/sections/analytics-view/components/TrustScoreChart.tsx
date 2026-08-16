import type { TrustTrendPoint } from "../../../types";
import { GlassCard } from "@/features/shared/GlassCard";

type Props = {
  trend: TrustTrendPoint[];
  duplicateRate: number | null;
  reviewerProductivity7d: number;
  peakReviewHour: number | null;
};

function formatHourRange(hour: number | null): string {
  if (hour == null) return "—";
  const next = (hour + 1) % 24;
  const fmt = (h: number) => `${h.toString().padStart(2, "0")}:00`;
  return `${fmt(hour)}–${fmt(next)}`;
}

export default function TrustScoreChart({
  trend,
  duplicateRate,
  reviewerProductivity7d,
  peakReviewHour,
}: Props) {
  return (
    <div>
      <GlassCard flat className="card" style={{ marginBottom: 12 }}>
        <div className="ch">
          <span className="ct">AI Trust Score Trend</span>
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            marginBottom: 10,
          }}
        >
          Daily average of place.aiOverallScore, trailing 14 days
        </div>
        {trend.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "12px 0" }}>
            No AI-validated places yet.
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              gap: 3,
              alignItems: "flex-end",
              height: 50,
            }}
          >
            {trend.map((point, i) => (
              <div
                key={point.day}
                title={`${point.day}: ${point.avg_score.toFixed(1)}`}
                style={{
                  flex: 1,
                  background: i === trend.length - 1 ? "var(--fill-accent)" : "var(--surface-3)",
                  borderRadius: "3px 3px 0 0",
                  height: `${Math.max(point.avg_score, 2)}%`,
                }}
              />
            ))}
          </div>
        )}
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
            {duplicateRate != null ? `${duplicateRate.toFixed(1)}%` : "—"}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
            Applied vs. rejected AI-proposed merges
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
            Reviewer Activity (7d)
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            {reviewerProductivity7d}{" "}
            <span
              style={{
                fontSize: 12,
                fontWeight: 400,
                color: "var(--text-muted)",
              }}
            >
              reviews
            </span>
          </div>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-secondary)",
              marginTop: 2,
            }}
          >
            Place reviews + merge decisions, last 7 days
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
            <span style={{ color: "var(--text-muted)" }}>PEAK HOUR (ALL TIME)</span>
            <strong>{formatHourRange(peakReviewHour)}</strong>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
