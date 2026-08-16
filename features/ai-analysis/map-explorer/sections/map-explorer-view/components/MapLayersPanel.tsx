import { GlassCard } from "@/features/shared/GlassCard";
import type { OverlayId } from "../MapExplorerPage";

type Props = {
  overlays: { id: OverlayId; label: string; dot_class: string }[];
  enabledOverlays: Set<OverlayId>;
  minTrustScore: number;
  onOverlayToggle: (id: OverlayId) => void;
  onTrustScoreChange: (value: number) => void;
};

export default function MapLayersPanel({
  overlays,
  enabledOverlays,
  minTrustScore,
  onOverlayToggle,
  onTrustScoreChange,
}: Props) {
  return (
    <GlassCard flat className="card" style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Map Layers</div>

      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: ".05em",
          marginBottom: 8,
        }}
      >
        Filter to Overlay
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        {overlays.map((overlay) => (
          <label
            key={overlay.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span className={`dot ${overlay.dot_class}`} />
              <span style={{ fontSize: 12 }}>{overlay.label}</span>
            </div>
            <input
              type="checkbox"
              checked={enabledOverlays.has(overlay.id)}
              onChange={() => onOverlayToggle(overlay.id)}
            />
          </label>
        ))}
      </div>
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 12 }}>
        No overlays checked shows every place.
      </div>

      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: ".05em",
          marginBottom: 8,
        }}
      >
        Filter Criteria
      </div>

      <div className="fg">
        <div className="fl">Minimum Trust Score</div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={minTrustScore}
          onChange={(e) => onTrustScoreChange(Number(e.target.value))}
          style={{ padding: 0, border: "none", background: "transparent", cursor: "pointer", width: "100%" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)" }}>
          <span>0</span>
          <span>{minTrustScore}</span>
          <span>100</span>
        </div>
      </div>
    </GlassCard>
  );
}
