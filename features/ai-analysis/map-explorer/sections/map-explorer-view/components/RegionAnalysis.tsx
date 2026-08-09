import type { RegionStats } from "../../../types";
import { GlassCard } from "@/features/shared/GlassCard";

type Props = {
  stats: RegionStats;
  onRunAnalysis: () => void;
  onExport: () => void;
};

export default function RegionAnalysis({ stats, onRunAnalysis, onExport }: Props) {
  return (
    <GlassCard flat className="card">
      <div className="ch">
        <span className="ct">Region Analysis: Selected Area</span>
        <span className="chip hi">High Risk</span>
      </div>
      <div className="g3" style={{ gap: 8, marginBottom: 10 }}>
        <GlassCard flat className="mc">
          <div className="ml">Total Points</div>
          <div className="mv">{stats.total_points.toLocaleString()}</div>
          <div className="ms">nodes</div>
        </GlassCard>
        <GlassCard flat className="mc">
          <div className="ml">Duplicate Density</div>
          <div className="mv" style={{ color: "var(--text-danger)" }}>
            {stats.duplicate_density}%
          </div>
          <div className="ms">critical</div>
        </GlassCard>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, justifyContent: "center" }}>
          <button
            className="btn p sm"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={onRunAnalysis}
          >
            Run Deep Analysis
          </button>
          <button
            className="btn sm"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={onExport}
          >
            Export Data
          </button>
        </div>
      </div>
    </GlassCard>
  );
}