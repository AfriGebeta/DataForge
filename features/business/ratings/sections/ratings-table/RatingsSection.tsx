import type { Rating } from "../../types";

type Props = {
  ratings: Rating[];
  placeNames: Record<string, string>;
  total: number;
  offset: number;
  limit: number;
  loading: boolean;
  placeIdFilter: string;
  onPlaceIdFilter: (value: string) => void;
  onOffsetChange: (offset: number) => void;
  onRefresh: () => void;
  onDelete: (rating: Rating) => void;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Stars({ value }: { value: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <i
          key={i}
          className={i < value ? "ti ti-star-filled" : "ti ti-star"}
          style={{ color: i < value ? "var(--text-warning, #eab308)" : "var(--text-muted)", fontSize: 14 }}
        />
      ))}
    </span>
  );
}

export default function RatingsSection({
  ratings, placeNames, total, offset, limit, loading,
  placeIdFilter, onPlaceIdFilter, onOffsetChange,
  onRefresh, onDelete,
}: Props) {
  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasPrevious = offset > 0;
  const hasNext = offset + limit < total;

  return (
    <>
      <div className="page-hd">
        <h2>Ratings</h2>
        <p>Individual 1–5 star ratings submitted by map-app users for a place. Read + delete only — ratings are never created or edited from this admin tool.</p>
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
      </div>

      <div className="card">
        {loading ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Loading...</p>
        ) : ratings.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>No ratings found.</p>
        ) : (
          <table>
            <colgroup>
              <col style={{ width: "22%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "20%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Place</th>
                <th>Rating</th>
                <th>User ID</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ratings.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>
                    {placeNames[r.placeId] ?? <span style={{ color: "var(--text-muted)" }}>{`place #${r.placeId}`}</span>}
                  </td>
                  <td><Stars value={r.rating} /></td>
                  <td style={{ color: "var(--text-secondary)", fontFamily: "monospace", fontSize: 12 }}>{r.userId}</td>
                  <td style={{ color: "var(--text-muted)" }}>{formatDate(r.createdAt)}</td>
                  <td>
                    <div className="row-act">
                      <button className="btn sm d" onClick={() => onDelete(r)}>
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

      {total > limit && (
        <div className="toolbar" style={{ justifyContent: "flex-end" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", marginRight: 8 }}>
            Page {page} of {totalPages} ({total} total)
          </span>
          <button
            className="btn sm"
            disabled={!hasPrevious}
            onClick={() => onOffsetChange(Math.max(0, offset - limit))}
          >
            <i className="ti ti-chevron-left" />
          </button>
          <button
            className="btn sm"
            disabled={!hasNext}
            onClick={() => onOffsetChange(offset + limit)}
          >
            <i className="ti ti-chevron-right" />
          </button>
        </div>
      )}
    </>
  );
}
