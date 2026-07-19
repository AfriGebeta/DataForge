import type { ModelMetrics, RetrainingStatus as RetrainingStatusType } from "../../../types";

type Props = {
  retraining: RetrainingStatusType;
  falseNegatives: number;
  onForceRetrain: () => void;
};

export default function RetrainingStatus({
  retraining,
  falseNegatives,
  onForceRetrain,
}: Props) {
  return (
    <div className="card">
      <div className="ch">
        <span className="ct">
          <i className="ti ti-refresh" style={{ fontSize: 14, marginRight: 4 }} />
          Retraining Status
        </span>
      </div>
      <div className="fg">
        <div className="fl">Active Model Version</div>
        <span className="tag">{retraining.model_version}</span>
      </div>
      <div className="fg">
        <div className="fl">Last Trained</div>
        <div style={{ fontSize: 12 }}>{retraining.last_trained}</div>
      </div>
      <div className="fg">
        <div className="fl">Dataset Size</div>
        <div style={{ fontSize: 12 }}>
          {retraining.dataset_size}{" "}
          <span style={{ color: "var(--text-success)" }}>
            (Delta: {retraining.dataset_delta})
          </span>
        </div>
      </div>
      <div className="fg">
        <div
          className="fl"
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          Next Epoch Readiness
          <strong style={{ color: "var(--text-accent)" }}>
            {retraining.epoch_readiness_percent}%
          </strong>
        </div>
        <div className="pb">
          <div
            className="pbf"
            style={{ width: `${retraining.epoch_readiness_percent}%` }}
          />
        </div>
      </div>
      <button
        className="btn"
        style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
        onClick={onForceRetrain}
      >
        <i className="ti ti-refresh" />
        Force Retrain (Admin)
      </button>
      <div className="mc" style={{ marginTop: 10, background: "var(--surface-0)" }}>
        <div className="ml">False Negatives</div>
        <div className="mv">{falseNegatives}</div>
        <div className="ms">Within tolerance</div>
      </div>
    </div>
  );
}