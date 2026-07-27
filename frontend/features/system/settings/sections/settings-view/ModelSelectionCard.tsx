import type { Model, ModelStatus } from "../../types";

type Props = {
  models: Model[];
  onSelect: (id: string) => void;
};

function modelStyle(status: ModelStatus): React.CSSProperties {
  if (status === "ACTIVE") return {
    background: "var(--bg-accent)",
    border: "2px solid var(--fill-accent)",
    borderRadius: 8,
    padding: 10,
    cursor: "pointer",
  };
  if (status === "AVAILABLE") return {
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: 10,
    cursor: "pointer",
  };
  return {
    background: "var(--surface-1)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: 10,
    opacity: 0.5,
    cursor: "not-allowed",
  };
}

function StatusBadge({ status }: { status: ModelStatus }) {
  if (status === "ACTIVE") return <span className="bx s" style={{ fontSize: 10 }}>ACTIVE</span>;
  if (status === "AVAILABLE") return <span className="bx m" style={{ fontSize: 10 }}>AVAILABLE</span>;
  return <span className="bx m" style={{ fontSize: 10 }}>LOCKED</span>;
}

export default function ModelSelectionCard({ models, onSelect }: Props) {
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="ch">
        <span className="ct">
          <i className="ti ti-refresh" style={{ fontSize: 14, marginRight: 5 }} />
          Model Selection
        </span>
      </div>
      <div className="g3" style={{ gap: 8, marginBottom: 0 }}>
        {models.map((model) => (
          <div
            key={model.id}
            style={modelStyle(model.status)}
            onClick={() => model.status !== "LOCKED" && onSelect(model.id)}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 5,
              }}
            >
              <strong style={{ fontSize: 11 }}>{model.name}</strong>
              {model.status === "ACTIVE" && (
                <span className="dot db" style={{ margin: "2px 0 0" }} />
              )}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--text-secondary)",
                marginBottom: 6,
              }}
            >
              {model.description}
            </div>
            <StatusBadge status={model.status} />
          </div>
        ))}
      </div>
    </div>
  );
}