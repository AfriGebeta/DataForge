import type { MapExplorerData } from "../../types";
import { MapCanvas, MapLayersPanel, RegionAnalysis } from "./components";

type Props = {
  data: MapExplorerData;
  onOverlayToggle: (id: string) => void;
  onTrustScoreChange: (value: number) => void;
  onDataSourceChange: (value: string) => void;
  onRunAnalysis: () => void;
  onExport: () => void;
};

export default function MapExplorerSection({
  data,
  onOverlayToggle,
  onTrustScoreChange,
  onDataSourceChange,
  onRunAnalysis,
  onExport,
}: Props) {
  return (
    <>
      <div
        className="page-hd"
        style={{ display: "flex", alignItems: "center", gap: 10 }}
      >
        <h2>Global Map Explorer</h2>
        <span className="bx s">LIVE SYNC</span>
      </div>

      <div className="g1-2">
        <MapLayersPanel
          overlays={data.overlays}
          trustScoreRange={data.trust_score_range}
          dataSource={data.data_source}
          onOverlayToggle={onOverlayToggle}
          onTrustScoreChange={onTrustScoreChange}
          onDataSourceChange={onDataSourceChange}
        />

        <div>
          <MapCanvas cluster={data.active_cluster} />
          <RegionAnalysis
            stats={data.region_stats}
            onRunAnalysis={onRunAnalysis}
            onExport={onExport}
          />
        </div>
      </div>
    </>
  );
}