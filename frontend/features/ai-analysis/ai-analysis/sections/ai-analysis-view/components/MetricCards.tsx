import type { ModelMetrics } from "../../../types";

type Props = {
  metrics: ModelMetrics;
};

export default function MetricCards({ metrics }: Props) {
  return (
    <div className="g4" style={{ marginBottom: 14 }}>
      <div className="mc">
        <div className="ml">Global F1-Score</div>
        <div className="mv" style={{ color: "var(--text-success)" }}>
          {metrics.f1_score}
        </div>
        <div className="ms" style={{ color: "var(--text-success)" }}>
          ↑ +{metrics.f1_delta} from last epoch
        </div>
      </div>
      <div className="mc">
        <div className="ml">Precision</div>
        <div className="mv">{metrics.precision}</div>
        <div className="ms">High confidence threshold</div>
      </div>
      <div className="mc">
        <div className="ml">Recall</div>
        <div className="mv">{metrics.recall}</div>
        <div className="ms">Capture rate maintained</div>
      </div>
      <div className="mc" style={{ borderColor: "rgba(248,113,113,0.25)" }}>
        <div className="ml">False Positives</div>
        <div className="mv" style={{ color: "var(--text-danger)" }}>
          {metrics.false_positives.toLocaleString()}
        </div>
        <div className="ms" style={{ color: "var(--text-danger)" }}>
          ↑ Requires review
        </div>
      </div>
    </div>
  );
}