import type { MapExplorerData, MapPoint } from "../../types";
import type { OverlayId } from "./MapExplorerPage";
import { MapCanvas, MapLayersPanel, RegionAnalysis } from "./components";

type Props = {
  data: MapExplorerData;
  overlays: { id: OverlayId; label: string; dot_class: string }[];
  enabledOverlays: Set<OverlayId>;
  onOverlayToggle: (id: OverlayId) => void;
  minTrustScore: number;
  onTrustScoreChange: (value: number) => void;
  points: MapPoint[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onExport: () => void;
};

export default function MapExplorerSection({
  data,
  overlays,
  enabledOverlays,
  onOverlayToggle,
  minTrustScore,
  onTrustScoreChange,
  points,
  selectedId,
  onSelect,
  onExport,
}: Props) {
  return (
    <>
      <div className="page-hd" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h2>Map Explorer</h2>
        <span className="bx s">{data.data_source}</span>
      </div>

      <div className="g1-2">
        <MapLayersPanel
          overlays={overlays}
          enabledOverlays={enabledOverlays}
          minTrustScore={minTrustScore}
          onOverlayToggle={onOverlayToggle}
          onTrustScoreChange={onTrustScoreChange}
        />

        <div>
          <MapCanvas points={points} selectedId={selectedId} onSelect={onSelect} />
          <RegionAnalysis
            totalPoints={data.total_points}
            shownPoints={points.length}
            duplicateDensityPercent={data.duplicate_density_percent}
            needsReviewCount={data.needs_review_count}
            onExport={onExport}
          />
        </div>
      </div>
    </>
  );
}
