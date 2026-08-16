import type { ReviewQueueItem } from "../../../types";
import { GlassCard } from "@/features/shared/GlassCard";
import { timeAgo } from "@/lib/utils";

type Props = {
  item: ReviewQueueItem;
  busy: boolean;
  onReject: () => void;
  onApprove: () => void;
};

export default function FeedbackDetailPanel({ item, busy, onReject, onApprove }: Props) {
  const reasons = item.ai_reasons ?? [];

  return (
    <GlassCard flat className="card">
      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          marginBottom: 8,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>
          {item.name ?? `Place #${item.place_id}`} · #{item.place_id}
        </span>
        <span>Validated {timeAgo(item.ai_validated_at)}</span>
      </div>

      <div className="g2" style={{ gap: 8, marginBottom: 10 }}>
        <div>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: ".05em",
              marginBottom: 5,
            }}
          >
            AI Decision
          </div>
          <div
            style={{
              background: "var(--surface-0)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: 12,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 600 }}>{item.ai_decision ?? "—"}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              {item.place_type}
            </div>
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: ".05em",
              marginBottom: 5,
            }}
          >
            Overall Trust Score
          </div>
          <div
            style={{
              background: "var(--surface-0)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: 12,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {item.ai_overall_score != null ? `${item.ai_overall_score}%` : "—"}
            </div>
            <div className="pb" style={{ marginTop: 6 }}>
              <div className="pbf" style={{ width: `${item.ai_overall_score ?? 0}%` }} />
            </div>
          </div>
        </div>
      </div>

      {reasons.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>
            AI Reasons
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {reasons.map((reason) => (
              <span key={reason} className="tag">
                {reason}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6 }}>
        <button
          className="btn sm d"
          style={{ flex: 1, justifyContent: "center" }}
          onClick={onReject}
          disabled={busy}
        >
          Reject
        </button>
        <button
          className="btn sm p"
          style={{ flex: 1, justifyContent: "center" }}
          onClick={onApprove}
          disabled={busy}
        >
          Approve
        </button>
      </div>
    </GlassCard>
  );
}
