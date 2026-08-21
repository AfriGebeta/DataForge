"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type { ColumnDef };

type Props<T> = {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  /** Opt-in checkbox column. Requires getRowId. */
  enableSelection?: boolean;
  getRowId?: (row: T) => string;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
};

export default function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = "No results found.",
  onRowClick,
  enableSelection = false,
  getRowId,
  selectedIds,
  onSelectionChange,
}: Props<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Controlled from outside via selectedIds — keeps the checkbox state in
  // sync when the caller clears selection after a bulk action.
  useEffect(() => {
    if (!selectedIds) return;
    const next: RowSelectionState = {};
    selectedIds.forEach((id) => {
      next[id] = true;
    });
    setRowSelection(next);
  }, [selectedIds]);

  const tableColumns = enableSelection
    ? [selectionColumn<T>(), ...columns]
    : columns;

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, pagination, rowSelection },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onRowSelectionChange: (updater) => {
      const next = typeof updater === "function" ? updater(rowSelection) : updater;
      setRowSelection(next);
      onSelectionChange?.(new Set(Object.keys(next).filter((id) => next[id])));
    },
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
    enableRowSelection: enableSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="w-full">
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-[12px] text-[color:var(--text-muted)]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[color:var(--border)] border-t-[color:var(--orange-400)]"></div>
          <p>Loading data...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-[12px] text-[color:var(--text-muted)]">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg ring-1 ring-inset ring-[color:var(--border)]">
            <table className="w-full text-left text-[12px]">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className="bg-[color:var(--surface-1)] text-[10px] uppercase tracking-[0.14em] text-[color:var(--text-muted)]"
                  >
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-5 py-3.5 font-medium"
                        style={{
                          width: header.getSize() !== 150 ? header.getSize() : undefined,
                          cursor: header.column.getCanSort() ? "pointer" : "default",
                        }}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-1.5">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === "asc" && (
                            <span className="text-[color:var(--orange-400)]">↑</span>
                          )}
                          {header.column.getIsSorted() === "desc" && (
                            <span className="text-[color:var(--orange-400)]">↓</span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                    className={cn(
                      "border-t border-[color:var(--border)] transition hover:bg-[color:var(--surface-2)]",
                      onRowClick && "cursor-pointer",
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-5 py-3.5 text-[color:var(--text-secondary)]">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[color:var(--border)] px-5 py-4 text-[12px] text-[color:var(--text-muted)]">
            <div>
              Showing {table.getFilteredRowModel().rows.length} rows
            </div>

            <div className="flex flex-wrap items-center gap-6 lg:gap-8">
              <div className="flex items-center gap-2">
                <p className="whitespace-nowrap font-medium text-[color:var(--text-secondary)]">Rows per page</p>
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={(e) => {
                    table.setPageSize(Number(e.target.value));
                  }}
                  className="rounded border border-[color:var(--border)] bg-[color:var(--surface-1)] px-2 py-1 text-[color:var(--text-secondary)] outline-none transition hover:bg-[color:var(--surface-3)] focus:border-[color:var(--orange-400)]/50"
                >
                  {[10, 25, 50].map((pageSize) => (
                    <option key={pageSize} value={pageSize} className="bg-[color:var(--surface-2)]">
                      {pageSize}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-center font-medium text-[color:var(--text-secondary)]">
                {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  className="inline-flex h-7 w-7 items-center justify-center rounded border border-[color:var(--border)] bg-[color:var(--surface-1)] transition hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text-primary)] disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="inline-flex h-7 w-7 items-center justify-center rounded border border-[color:var(--border)] bg-[color:var(--surface-1)] transition hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text-primary)] disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="inline-flex h-7 w-7 items-center justify-center rounded border border-[color:var(--border)] bg-[color:var(--surface-1)] transition hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text-primary)] disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  className="inline-flex h-7 w-7 items-center justify-center rounded border border-[color:var(--border)] bg-[color:var(--surface-1)] transition hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text-primary)] disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function selectionColumn<T>(): ColumnDef<T> {
  return {
    id: "__select__",
    size: 40,
    // Selects across every loaded row (all pages), not just the current
    // page — a "select all" that only grabbed the visible page was
    // confusing when the table paginates client-side but the data behind
    // it can be much larger than one page.
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllRowsSelected()}
        ref={(el) => {
          if (el) el.indeterminate = table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected();
        }}
        onChange={table.getToggleAllRowsSelectedHandler()}
        onClick={(e) => e.stopPropagation()}
        className="h-3.5 w-3.5 cursor-pointer accent-[color:var(--orange-400)]"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
        onClick={(e) => e.stopPropagation()}
        className="h-3.5 w-3.5 cursor-pointer accent-[color:var(--orange-400)]"
      />
    ),
  };
}
