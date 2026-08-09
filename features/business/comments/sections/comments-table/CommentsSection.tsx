import type { PlaceComment } from "../../types";

type Props = {
  comments: PlaceComment[];
  placeNames: Record<string, string>;
  total: number;
  offset: number;
  limit: number;
  loading: boolean;
  placeIdFilter: string;
  onPlaceIdFilter: (value: string) => void;
  onOffsetChange: (offset: number) => void;
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (comment: PlaceComment) => void;
  onDelete: (comment: PlaceComment) => void;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export default function CommentsSection({
  comments, placeNames, total, offset, limit, loading,
  placeIdFilter, onPlaceIdFilter, onOffsetChange,
  onRefresh, onCreate, onEdit, onDelete,
}: Props) {
  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasPrevious = offset > 0;
  const hasNext = offset + limit < total;

  return (
    <>
      <div className="page-hd">
        <h2>Comments</h2>
        <p>User-submitted comments on places, one per user per place.</p>
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
          Add Comment
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Loading...</p>
        ) : comments.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>No comments found.</p>
        ) : (
          <table>
            <colgroup>
              <col style={{ width: "16%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "36%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "12%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Place</th>
                <th>User</th>
                <th>Comment</th>
                <th>Photo</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {comments.map((comment) => (
                <tr key={comment.id}>
                  <td style={{ fontWeight: 500 }}>
                    {placeNames[comment.placeId] ?? <span style={{ color: "var(--text-muted)" }}>{`place #${comment.placeId}`}</span>}
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>{comment.userId}</td>
                  <td title={comment.body}>{truncate(comment.body, 80)}</td>
                  <td>
                    {comment.photoUrl ? (
                      <a href={comment.photoUrl} target="_blank" rel="noreferrer">
                        <i className="ti ti-photo" /> View
                      </a>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>{formatDate(comment.createdAt)}</td>
                  <td>
                    <div className="row-act">
                      <button className="btn sm" onClick={() => onEdit(comment)}>
                        <i className="ti ti-pencil" />
                        Edit
                      </button>
                      <button className="btn sm d" onClick={() => onDelete(comment)}>
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
