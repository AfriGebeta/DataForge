"use client";

import DataTable, { ColumnDef } from "@/components/ui/DataTable";
import type { CompletenessLevel, CompletenessRule, PlaceType } from "../../types";
import LevelBadge from "./LevelBadge";
import PlaceTypeBadge from "./PlaceTypeBadge";

type Props = {
  rules: CompletenessRule[];
  loading: boolean;
  placeTypeFilter: PlaceType | "";
  levelFilter: CompletenessLevel | "";
  onPlaceTypeFilter: (value: PlaceType | "") => void;
  onLevelFilter: (value: CompletenessLevel | "") => void;
  onDelete: (id: string) => void;
  onCreateRule: () => void;
};

export default function CompletenessRulesSection({
  rules,
  loading,
  placeTypeFilter,
  levelFilter,
  onPlaceTypeFilter,
  onLevelFilter,
  onDelete,
  onCreateRule,
}: Props) {
  const columns: ColumnDef<CompletenessRule>[] = [
    {
      accessorKey: "place_type",
      header: "Place type",
      size: 160,
      cell: ({ row }) => <PlaceTypeBadge placeType={row.original.place_type} />,
    },
    {
      accessorKey: "required_field",
      header: "Required field",
      size: 200,
      cell: ({ row }) => (
        <span className="mono">{row.original.required_field}</span>
      ),
    },
    {
      accessorKey: "weight",
      header: "Weight",
      size: 140,
      cell: ({ row }) => row.original.weight.toFixed(2),
    },
    {
      accessorKey: "level",
      header: "Level",
      size: 160,
      cell: ({ row }) => <LevelBadge level={row.original.level} />,
    },
    {
      accessorKey: "description",
      header: "Description",
      size: 240,
      cell: ({ row }) => (
        <span style={{ color: "var(--text-secondary)" }}>
          {row.original.description}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      size: 100,
      enableSorting: false,
      cell: ({ row }) => (
        <button
          className="btn sm d"
          onClick={() => onDelete(row.original.id)}
        >
          Delete
        </button>
      ),
    },
  ];

  return (
    <>
      <div className="page-hd">
        <h2>Completeness Rules</h2>
        <p>Define required fields and quality thresholds for each place type.</p>
      </div>

      <div className="toolbar">
        <select
          value={placeTypeFilter}
          onChange={(e) => onPlaceTypeFilter(e.target.value as PlaceType | "")}
          style={{ width: 120 }}
        >
          <option value="">All types</option>
          <option value="COUNTRY">COUNTRY</option>
          <option value="PROVINCE">PROVINCE</option>
          <option value="COUNTY">COUNTY</option>
          <option value="MUNICIPALITY">MUNICIPALITY</option>
          <option value="BOROUGH">BOROUGH</option>
          <option value="DISTRICT">DISTRICT</option>
          <option value="VILLAGE">VILLAGE</option>
          <option value="POSTAL_CODE">POSTAL_CODE</option>
          <option value="CUSTOM_ZONE">CUSTOM_ZONE</option>
          <option value="ROAD">ROAD</option>
          <option value="TRANSIT_LINE">TRANSIT_LINE</option>
          <option value="TRANSIT_STOP">TRANSIT_STOP</option>
          <option value="BUILDING">BUILDING</option>
          <option value="NATURAL_FEATURE">NATURAL_FEATURE</option>
          <option value="POI">POI</option>
        </select>

        <select
          value={levelFilter}
          onChange={(e) => onLevelFilter(e.target.value as CompletenessLevel | "")}
          style={{ width: 110 }}
        >
          <option value="">All levels</option>
          <option value="MINIMAL">MINIMAL</option>
          <option value="PARTIAL">PARTIAL</option>
          <option value="GOOD">GOOD</option>
          <option value="COMPLETE">COMPLETE</option>
        </select>

        <button
          className="btn p"
          style={{ marginLeft: "auto" }}
          onClick={onCreateRule}
        >
          <i className="ti ti-plus" />
          Create rule
        </button>
      </div>

      <DataTable
        columns={columns}
        data={rules}
        loading={loading}
        emptyMessage="No rules found."
      />
    </>
  );
}