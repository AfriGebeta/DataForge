"use client";

import DataTable, { ColumnDef } from "@/components/ui/DataTable";
import type {
  FlagCategory,
  FlagSeverity,
  FlagStats,
  FlagStatusFilter,
  ValidationFlag,
} from "../../types";
import SeverityBadge from "./SeverityBadge";

type Props = {
  flags: ValidationFlag[];
  stats: FlagStats | null;
  loading: boolean;
  categoryFilter: FlagCategory | "";
  severityFilter: FlagSeverity | "";
  statusFilter: FlagStatusFilter;
  onCategoryFilter: (value: FlagCategory | "") => void;
  onSeverityFilter: (value: FlagSeverity | "") => void;
  onStatusFilter: (value: FlagStatusFilter) => void;
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateFlag: () => void;
  onBulkResolve: () => void;
};

export default function ValidationFlagsSection({
  flags,
  stats,
  loading,
  categoryFilter,
  severityFilter,
  statusFilter,
  onCategoryFilter,
  onSeverityFilter,
  onStatusFilter,
  onResolve,
  onDelete,
  onCreateFlag,
  onBulkResolve,
}: Props) {
  const columns: ColumnDef<ValidationFlag>[] = [
    {
      accessorKey: "place_id",
      header: "Place ID",
      size: 140,
      cell: ({ row }) => (
        <span className="mono">{row.original.place_id}</span>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      size: 140,
      cell: ({ row }) => (
        <span className="tag">{row.original.category}</span>
      ),
    },
    {
      accessorKey: "severity",
      header: "Severity",
      size: 140,
      cell: ({ row }) => <SeverityBadge severity={row.original.severity} />,
    },
    {
      accessorKey: "flag_code",
      header: "Flag code",
      size: 160,
      cell: ({ row }) => (
        <span className="mono" style={{ fontSize: 10 }}>
          {row.original.flag_code}
        </span>
      ),
    },
    {
      accessorKey: "message",
      header: "Message",
      size: 260,
      cell: ({ row }) => (
        <span style={{ color: "var(--text-secondary)" }}>
          {row.original.message}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      size: 160,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="row-act">
          {!row.original.is_resolved && (
            <button
              className="btn sm"
              onClick={() => onResolve(row.original.id)}
            >
              Resolve
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
        <h2>Validation Flags</h2>
        <p>Open data quality issues requiring resolution.</p>
      </div>

      {stats && (
        <div className="g4" style={{ marginBottom: 14 }}>
          <div className="mc">
            <div className="ml">Critical</div>
            <div className="mv" style={{ color: "var(--text-danger)" }}>
              {stats.critical}
            </div>
          </div>
          <div className="mc">
            <div className="ml">Error</div>
            <div className="mv" style={{ color: "var(--text-danger)" }}>
              {stats.error}
            </div>
          </div>
          <div className="mc">
            <div className="ml">Warning</div>
            <div className="mv" style={{ color: "var(--text-warning)" }}>
              {stats.warning}
            </div>
          </div>
          <div className="mc">
            <div className="ml">Info</div>
            <div className="mv" style={{ color: "var(--text-accent)" }}>
              {stats.info}
            </div>
          </div>
        </div>
      )}

      <div className="toolbar">
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryFilter(e.target.value as FlagCategory | "")}
          style={{ width: 120 }}
        >
          <option value="">All categories</option>
          <option value="GEOMETRY">GEOMETRY</option>
          <option value="ADDRESS">ADDRESS</option>
          <option value="NAME">NAME</option>
          <option value="LANGUAGE">LANGUAGE</option>
          <option value="HIERARCHY">HIERARCHY</option>
          <option value="CONTACT">CONTACT</option>
          <option value="FRESHNESS">FRESHNESS</option>
          <option value="CONSISTENCY">CONSISTENCY</option>
        </select>

        <select
          value={severityFilter}
          onChange={(e) => onSeverityFilter(e.target.value as FlagSeverity | "")}
          style={{ width: 110 }}
        >
          <option value="">All severities</option>
          <option value="CRITICAL">CRITICAL</option>
          <option value="ERROR">ERROR</option>
          <option value="WARNING">WARNING</option>
          <option value="INFO">INFO</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => onStatusFilter(e.target.value as FlagStatusFilter)}
          style={{ width: 110 }}
        >
          <option value="unresolved">Unresolved</option>
          <option value="all">All</option>
          <option value="resolved">Resolved</option>
        </select>

        <button
          className="btn p"
          style={{ marginLeft: "auto" }}
          onClick={onCreateFlag}
        >
          <i className="ti ti-plus" />
          Create flag
        </button>
        <button className="btn" onClick={onBulkResolve}>
          <i className="ti ti-check" />
          Bulk resolve
        </button>
      </div>

      <DataTable
        columns={columns}
        data={flags}
        loading={loading}
        emptyMessage="No flags found."
      />
    </>
  );
}