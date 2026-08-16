import type { AIDecision, ReviewQueueItem } from "../../../types";
import { GlassCard } from "@/features/shared/GlassCard";
import { timeAgo } from "@/lib/utils";

type Props = {
  items: ReviewQueueItem[];
  total: number;
  loading: boolean;
  selectedId: number | null;
  onSelect: (item: ReviewQueueItem) => void;
};

function DecisionChip({ decision }: { decision: AIDecision | null }) {
  if (decision === "DUPLICATE") return <span className="chip hi">DUPLICATE</span>;
  if (decision === "INVALID") return <span className="chip hi">INVALID</span>;
  if (decision === "AMBIGUOUS") return <span className="chip md">AMBIGUOUS</span>;
  if (decision === "VALID") return <span className="chip lo">VALID</span>;
  return <span className="chip">UNSCORED</span>;
}

export default function ReviewQueue({ items, total, loading, selectedId, onSelect }: Props) {
  return (
    <GlassCard flat className="card">
      <div className="ch">
        <span className="ct">Review Queue</span>
      </div>

      {loading && items.length === 0 && (
        <div style={{ fontSize: 12, color: "var(--text-muted)", padding: 12 }}>Loading…</div>
      )}
      {!loading && items.length === 0 && (
        <div style={{ fontSize: 12, color: "var(--text-muted)", padding: 12 }}>
          Nothing needs review right now.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((item) => {
          const isFlagged = item.ai_decision === "DUPLICATE" || item.ai_decision === "INVALID";
          const isSelected = item.place_id === selectedId;
          return (
            <div
              key={item.place_id}
              onClick={() => onSelect(item)}
              style={{
                background: isFlagged ? "var(--bg-danger)" : "var(--surface-2)",
                border: isSelected
                  ? "1px solid var(--text-accent)"
                  : `1px solid ${isFlagged ? "rgba(248,113,113,0.2)" : "var(--border)"}`,
                borderRadius: 8,
                padding: 10,
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 6,
                  background: "var(--surface-3)",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                }}
              >
                {item.ai_overall_score != null ? Math.round(item.ai_overall_score) : "—"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <DecisionChip decision={item.ai_decision} />
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                    {timeAgo(item.ai_validated_at)}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    marginTop: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.name ?? `Place #${item.place_id}`}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  #{item.place_id} · {item.place_type}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          marginTop: 8,
        }}
      >
        Showing {items.length} of {total.toLocaleString()}
      </div>
    </GlassCard>
  );
}
