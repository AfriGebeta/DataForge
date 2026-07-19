import type { ModelFeedbackData } from "../../types";
import { FeedbackDetailPanel, MetricCards, ReviewQueue } from "./components";

type Props = {
  data: ModelFeedbackData;
  onDiscard: (id: string) => void;
  onApprove: (id: string) => void;
};

export default function ModelFeedbackSection({ data, onDiscard, onApprove }: Props) {
  const selectedItem = data.review_queue[0];

  return (
    <>
      <div
        className="page-hd"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <div>
          <h2>Model Feedback</h2>
          <p>
            Human-in-the-loop oversight — review misclassifications, validate
            corrections, monitor retraining pipeline.
          </p>
        </div>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
          MODEL VERSION{" "}
          <span className="bx s" style={{ marginLeft: 4 }}>
            {data.model_version}
          </span>
        </span>
      </div>

      <MetricCards
        humanCorrections={data.human_corrections}
        humanCorrectionsDelta={data.human_corrections_delta}
        aiMistakes={data.ai_mistakes}
        aiMistakesDelta={data.ai_mistakes_delta}
        retrainedSamples={data.retrained_samples}
        retrainedPercent={data.retrained_percent}
      />

      <div className="g2">
        <ReviewQueue items={data.review_queue} total={data.total_queue} />
        {selectedItem && (
          <FeedbackDetailPanel
            item={selectedItem}
            onDiscard={onDiscard}
            onApprove={onApprove}
          />
        )}
      </div>
    </>
  );
}