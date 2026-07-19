import type { FeedbackItem, FeedbackItemType } from "../../../types";

type Props = {
  items: FeedbackItem[];
  total: number;
};

function FeedbackChip({ type }: { type: FeedbackItemType }) {
  if (type === "MISCLASSIFIED") return <span className="chip hi">MISCLASSIFIED</span>;
  if (type === "LOW_CONFIDENCE") return <span className="chip md">LOW CONFIDENCE</span>;
  return <span className="chip lo">CORRECT</span>;
}

export default function ReviewQueue({ items, total }: Props) {
  return (
    <div className="card">
      <div className="ch">
        <span className="ct">Review Queue</span>
        <button className="btn ghost sm">
          <i className="ti ti-adjustments" />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((item) => {
          const isMisclassified = item.type === "MISCLASSIFIED";
          return (
            <div
              key={item.id}
              style={{
                background: isMisclassified ? "var(--bg-danger)" : "var(--surface-2)",
                border: `1px solid ${isMisclassified ? "rgba(248,113,113,0.2)" : "var(--border)"}`,
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
                }}
              >
                <i
                  className={`ti ${item.icon}`}
                  style={{ fontSize: 14, color: "var(--text-muted)" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <FeedbackChip type={item.type} />
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                    {item.time_ago}
                  </span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, marginTop: 2 }}>
                  ID: {item.geo_id}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {item.actual
                    ? `Pred: ${item.prediction} → Act: ${item.actual}`
                    : `Pred: ${item.prediction}`}
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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Showing 1-{items.length} of {total.toLocaleString()}
        <div style={{ display: "flex", gap: 4 }}>
          <button className="btn ghost sm">
            <i className="ti ti-chevron-left" />
          </button>
          <button className="btn ghost sm">
            <i className="ti ti-chevron-right" />
          </button>
        </div>
      </div>
    </div>
  );
}