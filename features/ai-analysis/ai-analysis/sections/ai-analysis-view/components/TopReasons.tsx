import type { ReasonCount } from "../../../types";
import { GlassCard } from "@/features/shared/GlassCard";

type Props = {
  items: ReasonCount[];
};

export default function TopReasons({ items }: Props) {
  const max = Math.max(1, ...items.map((r) => r.count));

  return (
    <GlassCard flat className="card">
      <div className="ch">
        <span className="ct">Top AI Review Reasons</span>
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10 }}>
        How often each reason appears across every place GeoValidator has looked at
      </div>
      {items.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>No AI reasons recorded yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((r) => (
            <div key={r.reason}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  marginBottom: 3,
                  gap: 8,
                }}
              >
                <span>{r.reason}</span>
                <strong>{r.count}</strong>
              </div>
              <div className="pb">
                <div className="pbf" style={{ width: `${(r.count / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
