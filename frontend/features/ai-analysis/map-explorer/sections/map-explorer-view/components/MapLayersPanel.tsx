import type { MapOverlay } from "../../../types";

type Props = {
  overlays: MapOverlay[];
  trustScoreRange: number;
  dataSource: string;
  onOverlayToggle: (id: string) => void;
  onTrustScoreChange: (value: number) => void;
  onDataSourceChange: (value: string) => void;
};

export default function MapLayersPanel({
  overlays,
  trustScoreRange,
  dataSource,
  onOverlayToggle,
  onTrustScoreChange,
  onDataSourceChange,
}: Props) {
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
        Map Layers
      </div>

      <div className="fg">
        <div className="fl">Search Region</div>
        <input type="text" placeholder="Coordinates or City…" />
      </div>

      <div className="sep" />

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
        Active Overlays
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
              checked={overlay.enabled}
              onChange={() => onOverlayToggle(overlay.id)}
            />
          </label>
        ))}
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
        <div className="fl">Trust Score Range</div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={trustScoreRange}
          onChange={(e) => onTrustScoreChange(Number(e.target.value))}
          style={{ padding: 0, border: "none", background: "transparent", cursor: "pointer", width: "100%" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)" }}>
          <span>0.0</span>
          <span>1.0</span>
        </div>
      </div>

      <div className="fg">
        <div className="fl">Data Source</div>
        <select value={dataSource} onChange={(e) => onDataSourceChange(e.target.value)}>
          <option>All Verified Sources</option>
          <option>OSM Only</option>
          <option>Gov Data Only</option>
        </select>
      </div>
    </div>
  );
}