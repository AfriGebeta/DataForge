import { GlassCard } from "@/features/shared/GlassCard";

type Props = {
  reviewQueueTotal: number;
  humanCorrections: number;
  aiMistakes: number;
};

export default function MetricCards({ reviewQueueTotal, humanCorrections, aiMistakes }: Props) {
  return (
    <div className="g3">
      <GlassCard flat className="mc">
        <i className="ti ti-clipboard-list mc-icon" />
        <div className="ml">Places Awaiting Review</div>
        <div className="mv">{reviewQueueTotal.toLocaleString()}</div>
        <div className="ms" style={{ color: "var(--text-muted)" }}>
          AI decision is AMBIGUOUS/DUPLICATE/INVALID, no human verdict yet
        </div>
      </GlassCard>
      <GlassCard flat className="mc">
        <i className="ti ti-pencil mc-icon" style={{ color: "var(--text-accent)" }} />
        <div className="ml">Human Corrections</div>
        <div className="mv" style={{ color: "var(--text-accent)" }}>
          {humanCorrections.toLocaleString()}
        </div>
        <div className="ms" style={{ color: "var(--text-muted)" }}>
          Places an admin rejected outright, all time
        </div>
      </GlassCard>
      <GlassCard flat className="mc">
        <i className="ti ti-alert-triangle mc-icon" style={{ color: "var(--text-warning)" }} />
        <div className="ml">AI Duplicate Mistakes</div>
        <div className="mv">{aiMistakes.toLocaleString()}</div>
        <div className="ms" style={{ color: "var(--text-muted)" }}>
          AI-proposed merges an admin rejected, all time
        </div>
      </GlassCard>
    </div>
  );
}
