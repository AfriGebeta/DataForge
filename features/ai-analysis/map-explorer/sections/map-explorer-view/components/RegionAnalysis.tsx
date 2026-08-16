import { GlassCard } from "@/features/shared/GlassCard";

type Props = {
  totalPoints: number;
  shownPoints: number;
  duplicateDensityPercent: number;
  needsReviewCount: number;
  onExport: () => void;
};

export default function RegionAnalysis({
  totalPoints,
  shownPoints,
  duplicateDensityPercent,
  needsReviewCount,
  onExport,
}: Props) {
  return (
    <GlassCard flat className="card">
      <div className="ch">
        <span className="ct">Dataset Summary</span>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Showing {shownPoints} of {totalPoints}
        </span>
      </div>
      <div className="g3" style={{ gap: 8, marginBottom: 10 }}>
        <GlassCard flat className="mc">
          <div className="ml">Active Places</div>
          <div className="mv">{totalPoints.toLocaleString()}</div>
          <div className="ms">total</div>
        </GlassCard>
        <GlassCard flat className="mc">
          <div className="ml">Duplicate Density</div>
          <div className="mv" style={{ color: "var(--text-danger)" }}>
            {duplicateDensityPercent.toFixed(1)}%
          </div>
          <div className="ms">AI-flagged</div>
        </GlassCard>
        <GlassCard flat className="mc">
          <div className="ml">Needs Review</div>
          <div className="mv" style={{ color: "var(--text-warning)" }}>
            {needsReviewCount.toLocaleString()}
          </div>
          <div className="ms">places</div>
        </GlassCard>
      </div>
      <button className="btn sm" style={{ width: "100%", justifyContent: "center" }} onClick={onExport}>
        <i className="ti ti-download" />
        Export Filtered Points (CSV)
      </button>
    </GlassCard>
  );
}
