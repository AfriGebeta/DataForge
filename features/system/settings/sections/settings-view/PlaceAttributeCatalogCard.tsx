import type { PlaceAttributeCatalogEntry } from "../../types";

type Props = {
  catalog: PlaceAttributeCatalogEntry[];
  onChange: (value: PlaceAttributeCatalogEntry[]) => void;
};

const VALUE_TYPES = ["STRING", "NUMBER", "BOOLEAN", "JSON", "URL", "DATETIME", "ARRAY"] as const;

// Admin-editable list backing Place → List/detail's Attributes picker (see
// PlaceDetailPage.tsx / PlaceAddPage.tsx, which read this via GET
// /settings instead of a hardcoded constant). PlaceAttribute stays a
// freeform key/value table on the backend — this only curates which keys
// get a dropdown entry instead of free-text.
export default function PlaceAttributeCatalogCard({ catalog, onChange }: Props) {
  const update = (i: number, patch: Partial<PlaceAttributeCatalogEntry>) =>
    onChange(catalog.map((entry, idx) => (idx === i ? { ...entry, ...patch } : entry)));

  const remove = (i: number) => onChange(catalog.filter((_, idx) => idx !== i));

  const add = () => onChange([...catalog, { key: "", label: "", valueType: "STRING" }]);

  return (
    <div className="card">
      <div className="ch">
        <span className="ct">
          <i className="ti ti-list-details" style={{ fontSize: 14, marginRight: 5 }} />
          Place Attribute Catalog
        </span>
        <button type="button" className="btn sm" onClick={add}>
          <i className="ti ti-plus" />
          Add
        </button>
      </div>
      <div className="fh" style={{ marginBottom: 10 }}>
        Suggested keys offered when editing a place&rsquo;s Attributes, as a dropdown instead of a
        blank key field. Anything left off this list is still storable there as a custom key.
      </div>
      {catalog.length === 0 && (
        <div style={{ padding: "8px 0", color: "var(--text-muted)", fontSize: 12 }}>
          No attributes defined — every editor falls back to &ldquo;Custom key&rdquo; only.
        </div>
      )}
      {catalog.map((entry, i) => (
        <div key={i} className="fr" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="fg" style={{ minWidth: 140 }}>
            <label className="fl">Key</label>
            <input
              type="text"
              placeholder="price_level"
              value={entry.key}
              onChange={(e) => update(i, { key: e.target.value })}
            />
          </div>
          <div className="fg" style={{ minWidth: 160 }}>
            <label className="fl">Label</label>
            <input
              type="text"
              placeholder="Price level"
              value={entry.label}
              onChange={(e) => update(i, { label: e.target.value })}
            />
          </div>
          <div className="fg" style={{ width: 120 }}>
            <label className="fl">Type</label>
            <select
              className="glass-select"
              value={entry.valueType}
              onChange={(e) =>
                update(i, { valueType: e.target.value as PlaceAttributeCatalogEntry["valueType"] })
              }
            >
              {VALUE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="fg" style={{ minWidth: 160 }}>
            <label className="fl">Options (comma-separated)</label>
            <input
              type="text"
              placeholder="1, 2, 3, 4"
              value={(entry.options ?? []).join(", ")}
              onChange={(e) => {
                const parsed = e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
                update(i, { options: parsed.length > 0 ? parsed : undefined });
              }}
            />
          </div>
          <div className="fg" style={{ minWidth: 200 }}>
            <label className="fl">Hint</label>
            <input
              type="text"
              placeholder="Shown under the field while editing"
              value={entry.hint ?? ""}
              onChange={(e) => update(i, { hint: e.target.value || undefined })}
            />
          </div>
          <button type="button" className="btn sm d" onClick={() => remove(i)} style={{ marginBottom: 8 }}>
            <i className="ti ti-x" />
          </button>
        </div>
      ))}
    </div>
  );
}
