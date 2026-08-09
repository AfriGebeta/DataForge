"use client";

import DataTable, { ColumnDef } from "@/components/ui/DataTable";
import type {
  DeltaAction,
  DeltaAppliedFilter,
  DeltaSourceType,
  PlaceDelta,
} from "../../types";
import ActionBadge from "./ActionBadge";

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
  const columns: ColumnDef<PlaceDelta>[] = [
    {
      accessorKey: "source_place_id",
      header: "Source place",
      size: 140,
      cell: ({ row }) => (
        <span className="mono">{row.original.source_place_id}</span>
      ),
    },
    {
      accessorKey: "action",
      header: "Action",
      size: 140,
      cell: ({ row }) => <ActionBadge action={row.original.action} />,
    },
    {
      accessorKey: "field_name",
      header: "Field",
      size: 100,
      cell: ({ row }) => (
        <span className="mono">{row.original.field_name}</span>
      ),
    },
    {
      accessorKey: "source_type",
      header: "Source type",
      size: 140,
      cell: ({ row }) => (
        <span className="tag">{row.original.source_type}</span>
      ),
    },
    {
      accessorKey: "after_value",
      header: "After value",
      size: 160,
      cell: ({ row }) => (
        <span className="mono">{row.original.after_value}</span>
      ),
    },
    {
      accessorKey: "is_applied",
      header: "Applied",
      size: 140,
      cell: ({ row }) =>
        row.original.is_applied ? (
          <span className="bx s">Yes</span>
        ) : (
          <span className="bx m">No</span>
        ),
    },
    {
      id: "actions",
      header: "Actions",
      size: 180,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="row-act">
          {!row.original.is_applied && (
            <button
              className="btn sm p"
              onClick={() => onApply(row.original.id)}
            >
              Apply
            </button>
          )}
          <button
            className="btn sm d"
            onClick={() => onDelete(row.original.id)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-hd">
        <h2>Place Deltas</h2>
        <p>Proposed field-level changes pending application to the place database.</p>
      </div>

      <div className="toolbar">
        <select
          value={actionFilter}
          onChange={(e) => onActionFilter(e.target.value as DeltaAction | "")}
          style={{ width: 100 }}
        >
          <option value="">All actions</option>
          <option value="ADD">ADD</option>
          <option value="UPDATE">UPDATE</option>
          <option value="REMOVE">REMOVE</option>
        </select>

        <select
          value={appliedFilter}
          onChange={(e) => onAppliedFilter(e.target.value as DeltaAppliedFilter)}
          style={{ width: 110 }}
        >
          <option value="unapplied">Unapplied</option>
          <option value="all">All</option>
          <option value="applied">Applied</option>
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => onSourceFilter(e.target.value as DeltaSourceType | "")}
          style={{ width: 130 }}
        >
          <option value="">All sources</option>
          <option value="USER_SUBMISSION">USER_SUBMISSION</option>
          <option value="OSM">OSM</option>
          <option value="PARTNER_IMPORT">PARTNER_IMPORT</option>
        </select>

        <button
          className="btn p"
          style={{ marginLeft: "auto" }}
          onClick={onRecordDelta}
        >
          <i className="ti ti-plus" />
          Record delta
        </button>
        <button className="btn" onClick={onBulkApply}>
          <i className="ti ti-check" />
          Bulk apply
        </button>
      </div>

      <DataTable
        columns={columns}
        data={deltas}
        loading={loading}
        emptyMessage="No deltas found."
      />
    </>
  );
}