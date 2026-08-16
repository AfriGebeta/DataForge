import type { ModelPerformanceData } from "../../types";
import { DecisionBreakdown, MetricCards, TopReasons } from "./components";

type Props = {
  data: ModelPerformanceData;
};

export default function AiAnalysisSection({ data }: Props) {
  return (
    <>
      <div className="page-hd">
        <h2>AI Analysis — System Performance</h2>
        <p>Real AI-validation coverage, decision breakdown, and what actually drives review flags.</p>
      </div>

      <MetricCards data={data} />

      <div className="g2">
        <TopReasons items={data.top_reasons} />
        <DecisionBreakdown items={data.decision_breakdown} total={data.total_places} />
      </div>
    </>
  );
}
