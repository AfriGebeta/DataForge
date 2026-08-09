import type { AiAnalysisData } from "../../types";
import {
  DecisionExplainer,
  ErrorHotspots,
  FeatureImportance,
  MetricCards,
  RetrainingStatus,
} from "./components";

type Props = {
  data: AiAnalysisData;
  onForceRetrain: () => void;
};

export default function AiAnalysisSection({ data, onForceRetrain }: Props) {
  return (
    <>
      <div className="page-hd">
        <h2>AI Analysis — System Performance</h2>
        <p>
          Model metrics, feature importance, error hotspots, and retraining
          status.
        </p>
      </div>

      <MetricCards metrics={data.metrics} />

      <div className="g2" style={{ marginBottom: 14 }}>
        <FeatureImportance items={data.feature_importance} />
        <ErrorHotspots hotspots={data.error_hotspots} />
      </div>

      <div className="g2">
        <DecisionExplainer />
        <RetrainingStatus
          retraining={data.retraining}
          falseNegatives={data.metrics.false_negatives}
          onForceRetrain={onForceRetrain}
        />
      </div>
    </>
  );
}