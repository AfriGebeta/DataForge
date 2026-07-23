import type { DeltaAction, DeltaAppliedFilter, DeltaSourceType, PlaceDelta } from "../../types";
import ActionBadge from "./ActionBadge";
import { GlassCard } from "@/features/shared/GlassCard";

type Props = {
  deltas: PlaceDelta[];
  loading: boolean;
  actionFilter: DeltaAction | "";
  appliedFilter: DeltaAppliedFilter;
  sourceFilter: DeltaSourceType | "";
  onActionFilter: (value: DeltaAction | "") => void;
  onAppliedFilter: (value: DeltaAppliedFilter) => void;
  onSourceFilter: (value: DeltaSourceType | "") => void;
  onApply: (id: string) => void;
  onDelete: (id: string) => void;
  onBulkApply: () => void;
  onRecordDelta: () => void;
};

export default function PlaceDeltasSection({
  deltas,
  loading,
  actionFilter,
  appliedFilter,
  sourceFilter,
  onActionFilter,
  onAppliedFilter,
  onSourceFilter,
  onApply,
  onDelete,
  onBulkApply,
  onRecordDelta,
}: Props) {
  return (
    <>
      <div className="page-hd">
        <h2>Place Deltas</h2>
        <p>Proposed field-level changes pending application to the place database.</p>
      </div>

      <div className="toolbar">
        <select value={actionFilter} onChange={(e) => onActionFilter(e.target.value as DeltaAction | "")} style={{ width: 100 }}>
          <option value="">All actions</option>
          <option value="ADD">ADD</option>
          <option value="UPDATE">UPDATE</option>
          <option value="REMOVE">REMOVE</option>
        </select>

        <select value={appliedFilter} onChange={(e) => onAppliedFilter(e.target.value as DeltaAppliedFilter)} style={{ width: 110 }}>
          <option value="unapplied">Unapplied</option>
          <option value="all">All</option>
          <option value="applied">Applied</option>
        </select>

        <select value={sourceFilter} onChange={(e) => onSourceFilter(e.target.value as DeltaSourceType | "")} style={{ width: 130 }}>
          <option value="">All sources</option>
          <option value="USER_SUBMISSION">USER_SUBMISSION</option>
          <option value="OSM">OSM</option>
          <option value="PARTNER_IMPORT">PARTNER_IMPORT</option>
        </select>

        <button className="btn p" style={{ marginLeft: "auto" }} onClick={onRecordDelta}>
          <i className="ti ti-plus" />
          Record delta
        </button>
        <button className="btn" onClick={onBulkApply}>
          <i className="ti ti-check" />
          Bulk apply
        </button>
      </div>

      <GlassCard flat className="card">
        {loading ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Loading...</p>
        ) : deltas.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>No deltas found.</p>
        ) : (
          <table>
            <colgroup>
              <col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "18%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Source place</th>
                <th>Action</th>
                <th>Field</th>
                <th>Source type</th>
                <th>After value</th>
                <th>Applied</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deltas.map((delta) => (
                <tr key={delta.id}>
                  <td className="mono">{delta.source_place_id}</td>
                  <td><ActionBadge action={delta.action} /></td>
                  <td className="mono">{delta.field_name}</td>
                  <td><span className="tag">{delta.source_type}</span></td>
                  <td className="mono">{delta.after_value}</td>
                  <td>
                    {delta.is_applied
                      ? <span className="bx s">Yes</span>
                      : <span className="bx m">No</span>
                    }
                  </td>
                  <td>
                    <div className="row-act">
                      {!delta.is_applied && (
                        <button className="btn sm p" onClick={() => onApply(delta.id)}>Apply</button>
                      )}
                      <button className="btn sm d" onClick={() => onDelete(delta.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>
    </>
  );
}