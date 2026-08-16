import type { ModelPerformanceData } from "../../../types";
import { GlassCard } from "@/features/shared/GlassCard";
import { timeAgo } from "@/lib/utils";

type Props = {
  data: ModelPerformanceData;
};

export default function MetricCards({ data }: Props) {
  return (
    <div className="g4" style={{ marginBottom: 14 }}>
      <GlassCard flat className="mc">
        <div className="ml">AI Validation Coverage</div>
        <div className="mv" style={{ color: "var(--text-success)" }}>
          {data.coverage_percent.toFixed(1)}%
        </div>
        <div className="ms" style={{ color: "var(--text-muted)" }}>
          {data.validated_count} of {data.total_places} places validated
        </div>
      </GlassCard>
      <GlassCard flat className="mc">
        <div className="ml">Avg. Overall Trust Score</div>
        <div className="mv">
          {data.avg_overall_score != null ? data.avg_overall_score.toFixed(1) : "—"}
        </div>
        <div className="ms">Across validated places</div>
      </GlassCard>
      <GlassCard flat className="mc">
        <div className="ml">Unvalidated Places</div>
        <div className="mv" style={{ color: "var(--text-warning)" }}>
          {(data.total_places - data.validated_count).toLocaleString()}
        </div>
        <div className="ms">No AI opinion submitted yet</div>
      </GlassCard>
      <GlassCard flat className="mc">
        <div className="ml">Last Validated</div>
        <div className="mv" style={{ fontSize: 16 }}>
          {timeAgo(data.last_validated_at)}
        </div>
        <div className="ms">Most recent AI decision received</div>
      </GlassCard>
    </div>
  );
}
