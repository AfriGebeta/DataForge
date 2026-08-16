"use client";

import DataTable, { ColumnDef } from "@/components/ui/DataTable";
import type { MergeRecord, MergeStrategy } from "../../types";
import StrategyBadge from "./StrategyBadge";

const columns: ColumnDef<MergeRecord>[] = [
  {
    accessorKey: "winner_id",
    header: "Winner",
    size: 200,
    cell: ({ row }) => (
      <div>
        <div>{row.original.winner_name ?? `Place #${row.original.winner_id}`}</div>
        <span className="mono" style={{ color: "var(--text-muted)", fontSize: 12 }}>
          #{row.original.winner_id}
          {row.original.winner_ai_duplicate_score != null &&
            ` · ${row.original.winner_ai_duplicate_score}% dup`}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "loser_id",
    header: "Loser",
    size: 200,
    cell: ({ row }) => (
      <div>
        <div>
          {row.original.loser_name ??
            (row.original.status === "APPLIED"
              ? `Place #${row.original.loser_id} (merged away)`
              : `Place #${row.original.loser_id}`)}
        </div>
        <span className="mono" style={{ color: "var(--text-muted)", fontSize: 12 }}>
          #{row.original.loser_id}
          {row.original.loser_ai_duplicate_score != null &&
            ` · ${row.original.loser_ai_duplicate_score}% dup`}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "strategy",
    header: "Strategy",
    size: 200,
    cell: ({ row }) => <StrategyBadge strategy={row.original.strategy} />,
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 110,
    cell: ({ row }) => <span className="tag">{row.original.status}</span>,
  },
  {
    accessorKey: "reason",
    header: "Reason",
    size: 260,
    cell: ({ row }) => (
      <span style={{ color: "var(--text-secondary)" }}>{row.original.reason}</span>
    ),
  },
  {
    accessorKey: "merged_by",
    header: "Merged by",
    size: 120,
    cell: ({ row }) => (
      <span style={{ color: "var(--text-muted)" }}>{row.original.merged_by ?? "—"}</span>
    ),
  },
  {
    accessorKey: "merged_at",
    header: "Merged at",
    size: 160,
    cell: ({ row }) => (
      <span style={{ color: "var(--text-muted)" }}>{row.original.merged_at ?? "—"}</span>
    ),
  },
];

type Props = {
  records: MergeRecord[];
  loading: boolean;
  strategyFilter: MergeStrategy | "";
  onStrategyFilter: (value: MergeStrategy | "") => void;
  onRecordMerge: () => void;
};

export default function MergeRecordsSection({
  records,
  loading,
  strategyFilter,
  onStrategyFilter,
  onRecordMerge,
}: Props) {
  return (
    <>
      <div className="page-hd">
        <h2>Merge Records</h2>
        <p>History of entity merges — automated and manual.</p>
      </div>

      <div className="toolbar">
        <select
          value={strategyFilter}
          onChange={(e) => onStrategyFilter(e.target.value as MergeStrategy | "")}
          style={{ width: 150 }}
        >
          <option value="">All strategies</option>
          <option value="MANUAL">MANUAL</option>
          <option value="AUTO_DISTANCE">AUTO_DISTANCE</option>
          <option value="AUTO_NAME_MATCH">AUTO_NAME_MATCH</option>
          <option value="AUTO_OVERLAP">AUTO_OVERLAP</option>
        </select>

        <button
          className="btn p"
          style={{ marginLeft: "auto" }}
          onClick={onRecordMerge}
        >
          <i className="ti ti-plus" />
          Record merge
        </button>
      </div>

      <DataTable
        columns={columns}
        data={records}
        loading={loading}
        emptyMessage="No merge records found."
      />
    </>
  );
}