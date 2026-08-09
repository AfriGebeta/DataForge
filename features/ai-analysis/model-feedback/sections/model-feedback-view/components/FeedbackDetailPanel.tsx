import type { FeedbackItem } from "../../../types";
import { GlassCard } from "@/features/shared/GlassCard";

type Props = {
  item: FeedbackItem;
  onDiscard: (id: string) => void;
  onApprove: (id: string) => void;
};

export default function FeedbackDetailPanel({ item, onDiscard, onApprove }: Props) {
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
        <span>{item.geo_id} | Source: Sat-Sentinel-2</span>
        <div style={{ display: "flex", gap: 4 }}>
          <button className="btn ghost sm">
            <i className="ti ti-arrows-maximize" />
          </button>
          <button className="btn ghost sm">
            <i className="ti ti-settings" />
          </button>
        </div>
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
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            Model Prediction
            <span className="chip hi">Confidence: 89%</span>
          </div>
          <div
            style={{
              background: "var(--surface-0)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              height: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                width: "50%",
                height: "40%",
                border: "2px solid var(--text-danger)",
                position: "absolute",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--text-danger)",
                  whiteSpace: "nowrap",
                }}
              >
                Industrial Zone
              </span>
            </div>
            <i
              className="ti ti-building-factory-2"
              style={{ fontSize: 32, color: "var(--surface-3)" }}
            />
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
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            Ground Truth (Corrected)
            <span style={{ color: "var(--text-success)", fontSize: 10 }}>
              Verified: Annotator_04
            </span>
          </div>
          <div
            style={{
              background: "var(--surface-0)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              height: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                width: "50%",
                height: "40%",
                border: "2px solid var(--text-success)",
                position: "absolute",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--text-success)",
                  whiteSpace: "nowrap",
                }}
              >
                High-Density Residential
              </span>
            </div>
            <i
              className="ti ti-building"
              style={{ fontSize: 32, color: "var(--surface-3)" }}
            />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>
          Feedback Tagging
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          <span className="tag">Feature Extractor Error ×</span>
          <span className="tag">Resolution Artifact ×</span>
          <button className="btn ghost sm">+ Add Tag</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <button
          className="btn sm d"
          style={{ flex: 1, justifyContent: "center" }}
          onClick={() => onDiscard(item.id)}
        >
          Discard
        </button>
        <button
          className="btn sm p"
          style={{ flex: 1, justifyContent: "center" }}
          onClick={() => onApprove(item.id)}
        >
          Approve & Add to Retrain
        </button>
      </div>
    </GlassCard>
  );
}