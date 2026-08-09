import type { PlaceSource, PlaceSourcesPagination } from "../../types";

type Props = {
  sources: PlaceSource[];
  placeNames: Record<string, string>;
  pagination: PlaceSourcesPagination | null;
  loading: boolean;
  placeIdFilter: string;
  onPlaceIdFilter: (value: string) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (source: PlaceSource) => void;
  onDelete: (source: PlaceSource) => void;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PlaceSourcesSection({
  sources, placeNames, pagination, loading,
  placeIdFilter, onPlaceIdFilter, onPageChange,
  onRefresh, onCreate, onEdit, onDelete,
}: Props) {
  return (
    <>
      <div className="page-hd">
        <h2>Place Sources</h2>
        <p>External data sources (OSM, Wikidata, government registries, ...) contributing fields to a place record.</p>
      </div>

      <div className="toolbar">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Filter by place ID"
          value={placeIdFilter}
          onChange={(e) => onPlaceIdFilter(e.target.value)}
          style={{ width: 180 }}
        />
        <button className="btn" onClick={onRefresh}>
          <i className="ti ti-refresh" />
          Refresh
        </button>
        <button className="btn p" style={{ marginLeft: "auto" }} onClick={onCreate}>
          <i className="ti ti-plus" />
          Add Source
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Loading...</p>
        ) : sources.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>No place sources found.</p>
        ) : (
          <table>
            <colgroup>
              <col style={{ width: "20%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "17%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "20%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Place</th>
                <th>Source Type</th>
                <th>Source Name / ID</th>
                <th>Confidence</th>
                <th>Primary</th>
                <th>Fetched</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((src) => (
                <tr key={src.id}>
                  <td style={{ fontWeight: 500 }}>
                    {placeNames[src.placeId] ?? <span style={{ color: "var(--text-muted)" }}>{`place #${src.placeId}`}</span>}
                  </td>
                  <td>
                    <span className="bx m">{src.sourceType}</span>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>
                    {src.sourceName ?? src.sourceId ?? "—"}
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>{Math.round(src.confidenceScore * 100)}%</td>
                  <td>{src.isPrimary ? <span className="bx s">Primary</span> : <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                  <td style={{ color: "var(--text-muted)" }}>{formatDate(src.fetchedAt)}</td>
                  <td>
                    <div className="row-act">
                      <button className="btn sm" onClick={() => onEdit(src)}>
                        <i className="ti ti-pencil" />
                        Edit
                      </button>
                      <button className="btn sm d" onClick={() => onDelete(src)}>
                        <i className="ti ti-trash" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="toolbar" style={{ justifyContent: "flex-end" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", marginRight: 8 }}>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <button
            className="btn sm"
            disabled={!pagination.hasPrevious}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            <i className="ti ti-chevron-left" />
          </button>
          <button
            className="btn sm"
            disabled={!pagination.hasNext}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            <i className="ti ti-chevron-right" />
          </button>
        </div>
      )}
    </>
  );
}
