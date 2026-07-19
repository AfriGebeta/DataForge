import type { MapCluster } from "../../../types";

type Props = {
  cluster: MapCluster;
};

export default function MapCanvas({ cluster }: Props) {
  return (
    <div
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        height: 320,
        position: "relative",
        overflow: "hidden",
        marginBottom: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ color: "var(--text-muted)", textAlign: "center" }}>
        <i
          className="ti ti-map"
          style={{ fontSize: 48, opacity: 0.2, display: "block", marginBottom: 8 }}
        />
        <div style={{ fontSize: 12 }}>Map Canvas — Live Sync</div>
      </div>

      {/* Cluster tooltip */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "55%",
          background: "var(--surface-1)",
          border: "1px solid var(--border-strong)",
          borderRadius: 8,
          padding: "10px 12px",
          minWidth: 160,
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 5,
          }}
        >
          <strong style={{ fontSize: 11 }}>Cluster ID: {cluster.id}</strong>
          <i
            className="ti ti-alert-triangle"
            style={{ color: "var(--text-warning)", fontSize: 12 }}
          />
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
          {cluster.lat}, {cluster.lng}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
          <span>Trust Score</span>
          <strong style={{ color: "var(--text-danger)" }}>{cluster.trust_score}</strong>
        </div>
      </div>

      {/* Zoom controls */}
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <button
          className="btn ghost sm"
          style={{
            width: 28,
            height: 28,
            justifyContent: "center",
            padding: 0,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
          }}
        >
          +
        </button>
        <button
          className="btn ghost sm"
          style={{
            width: 28,
            height: 28,
            justifyContent: "center",
            padding: 0,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
          }}
        >
          −
        </button>
      </div>
    </div>
  );
}