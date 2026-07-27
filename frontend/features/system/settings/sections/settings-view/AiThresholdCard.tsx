type Props = {
  sensitivity: number;
  maxThreads: number;
  inferenceTimeout: number;
  onSensitivityChange: (value: number) => void;
  onMaxThreadsChange: (value: number) => void;
  onInferenceTimeoutChange: (value: number) => void;
};

export default function AiThresholdCard({
  sensitivity,
  maxThreads,
  inferenceTimeout,
  onSensitivityChange,
  onMaxThreadsChange,
  onInferenceTimeoutChange,
}: Props) {
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="ch">
        <span className="ct">
          <i className="ti ti-brain" style={{ fontSize: 14, marginRight: 5 }} />
          AI Threshold Configuration
        </span>
      </div>
      <div className="fg">
        <div
          className="fl"
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          Anomaly Detection Sensitivity
          <strong style={{ color: "var(--text-accent)" }}>{sensitivity}</strong>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={sensitivity}
          onChange={(e) => onSensitivityChange(Number(e.target.value))}
        />
        <div className="fh">Higher values require stricter geometric conformity.</div>
      </div>
      <div className="fr">
        <div className="fg">
          <div className="fl">Max Processing Threads</div>
          <input
            type="number"
            min={1}
            value={maxThreads}
            onChange={(e) => onMaxThreadsChange(Number(e.target.value))}
          />
        </div>
        <div className="fg">
          <div className="fl">Inference Timeout (ms)</div>
          <input
            type="number"
            value={inferenceTimeout}
            onChange={(e) => onInferenceTimeoutChange(Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}