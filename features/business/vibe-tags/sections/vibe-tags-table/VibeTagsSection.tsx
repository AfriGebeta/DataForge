import type { VibeTag } from "../../types";

type Props = {
  tags: VibeTag[];
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
  onEdit: (tag: VibeTag) => void;
  onDelete: (tag: VibeTag) => void;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function VibeTagsSection({
  tags, placeNames, total, offset, limit, loading,
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
        <h2>Vibe Tags</h2>
        <p>AI-extracted vibe/atmosphere tags mined from source text (reviews, listings, ...) for a place, with a confidence score and mention count.</p>
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
          Add Vibe Tag
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Loading...</p>
        ) : tags.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>No vibe tags found.</p>
        ) : (
          <table>
            <colgroup>
              <col style={{ width: "18%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "20%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Place</th>
                <th>Tag</th>
                <th>Confidence</th>
                <th>Mentions</th>
                <th>Language</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.id}>
                  <td style={{ fontWeight: 500 }}>
                    {placeNames[tag.placeId] ?? <span style={{ color: "var(--text-muted)" }}>{`place #${tag.placeId}`}</span>}
                  </td>
                  <td title={tag.rawSnippet ?? undefined}>
                    <span className="bx m">{tag.tag}</span>
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>{Math.round(tag.confidence * 100)}%</td>
                  <td style={{ color: "var(--text-muted)" }}>{tag.mentionCount}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{tag.language ?? "—"}</td>
                  <td style={{ color: "var(--text-muted)" }}>{formatDate(tag.createdAt)}</td>
                  <td>
                    <div className="row-act">
                      <button className="btn sm" onClick={() => onEdit(tag)}>
                        <i className="ti ti-pencil" />
                        Edit
                      </button>
                      <button className="btn sm d" onClick={() => onDelete(tag)}>
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
