import type { ModelFeedbackData, ReviewQueueItem } from "../../types";
import { FeedbackDetailPanel, MetricCards, ReviewQueue } from "./components";

type Props = {
  data: ModelFeedbackData;
  loading: boolean;
  selected: ReviewQueueItem | null;
  onSelect: (item: ReviewQueueItem) => void;
  actingOn: number | null;
  onReject: (placeId: number) => void;
  onApprove: (placeId: number) => void;
};

export default function ModelFeedbackSection({
  data,
  loading,
  selected,
  onSelect,
  actingOn,
  onReject,
  onApprove,
}: Props) {
  return (
    <>
      <div className="page-hd">
        <h2>Model Feedback</h2>
        <p>
          Human-in-the-loop oversight — places the AI flagged for review, and
          how often humans have had to override its decisions.
        </p>
      </div>

      <MetricCards
        reviewQueueTotal={data.total_queue}
        humanCorrections={data.human_corrections}
        aiMistakes={data.ai_mistakes}
      />

      <div className="g2">
        <ReviewQueue
          items={data.review_queue}
          total={data.total_queue}
          loading={loading}
          selectedId={selected?.place_id ?? null}
          onSelect={onSelect}
        />
        {selected && (
          <FeedbackDetailPanel
            item={selected}
            busy={actingOn === selected.place_id}
            onReject={() => onReject(selected.place_id)}
            onApprove={() => onApprove(selected.place_id)}
          />
        )}
      </div>
    </>
  );
}
