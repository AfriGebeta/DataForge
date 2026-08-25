"use client";

import { useEffect, useRef } from "react";
import { getLocalizedName } from "../../api";
import type { Category, CategoryLanguage } from "../../types";
import { GlassCard } from "@/features/shared/GlassCard";

/** Native checkboxes have no `indeterminate` JSX prop — it's a DOM-only property. */
function SelectAllCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate && !checked;
    }
  }, [indeterminate, checked]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label="Select all visible categories"
    />
  );
}

type CategoryStructureSectionProps = {
  categories: Category[];
  total: number;
  limit: number;
  offset: number;
  language: CategoryLanguage;
  loading: boolean;
  needsReviewOnly: boolean;
  needsReviewCount: number;
  markingReviewedId: string | null;
  searchInput: string;
  isSearching: boolean;
  onSearchInputChange: (value: string) => void;
  onLanguageChange: (language: CategoryLanguage) => void;
  onLimitChange: (limit: number) => void;
  onOffsetChange: (offset: number) => void;
  onToggleNeedsReviewOnly: (next: boolean) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onMarkReviewed: (category: Category) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (ids: string[]) => void;
  onBulkEdit: () => void;
  onBulkDelete: () => void;
};

type FlattenedCategory = {
  category: Category;
  depth: number;
};

function resolveIconClass(icon: string): string {
  const trimmed = icon.trim();

  if (!trimmed) {
    return "ti ti-folder";
  }

  if (trimmed.includes(" ")) {
    return trimmed;
  }

  if (trimmed.startsWith("ti-")) {
    return `ti ${trimmed}`;
  }

  return `ti ti-${trimmed}`;
}

function flattenCategories(categories: Category[]): FlattenedCategory[] {
  const byParent = new Map<string | null, Category[]>();

  categories.forEach((category) => {
    const parentKey = category.parentId ?? null;
    const siblings = byParent.get(parentKey) ?? [];
    siblings.push(category);
    byParent.set(parentKey, siblings);
  });

  byParent.forEach((siblings) => {
    siblings.sort((a, b) => {
      const aName = a.name.en ?? a.name.am ?? a.slug;
      const bName = b.name.en ?? b.name.am ?? b.slug;
      return aName.localeCompare(bName);
    });
  });

  const visited = new Set<string>();
  const flattened: FlattenedCategory[] = [];

  const visit = (parentId: string | null, depth: number) => {
    const siblings = byParent.get(parentId) ?? [];

    siblings.forEach((category) => {
      if (visited.has(category.id)) {
        return;
      }

      visited.add(category.id);
      flattened.push({ category, depth });
      visit(category.id, depth + 1);
    });
  };

  visit(null, 0);

  categories.forEach((category) => {
    if (!visited.has(category.id)) {
      flattened.push({ category, depth: 0 });
    }
  });

  return flattened;
}

export default function CategoryStructureSection({
  categories,
  total,
  limit,
  offset,
  language,
  loading,
  needsReviewOnly,
  needsReviewCount,
  markingReviewedId,
  searchInput,
  isSearching,
  onSearchInputChange,
  onLanguageChange,
  onLimitChange,
  onOffsetChange,
  onToggleNeedsReviewOnly,
  onEdit,
  onDelete,
  onMarkReviewed,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onBulkEdit,
  onBulkDelete,
}: CategoryStructureSectionProps) {
  const flattened = flattenCategories(categories);
  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + limit, total);
  const canGoBack = offset > 0;
  const canGoNext = offset + limit < total;
  const rootCount = categories.filter((category) => !category.parentId).length;
  const childCount = categories.length - rootCount;
  const visibleIds = flattened.map(({ category }) => category.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someVisibleSelected = visibleIds.some((id) => selectedIds.has(id));

  return (
    <div>
      <div className="ch category-header-wrap">
        <div>
          <div className="ct">Section A · Category Structure Table/Tree</div>
          <div className="csub">
            Existing categories fetched from{" "}
            <span className="mono">GET /api/v1/categories</span>.
          </div>
        </div>
        <div className="category-toolbar">
          <div className="category-search-box">
            <i className="ti ti-search" />
            <input
              id="category-search"
              type="search"
              value={searchInput}
              onChange={(event) => onSearchInputChange(event.target.value)}
              placeholder="Search by name or slug (any depth)…"
              aria-label="Search categories"
            />
            {searchInput ? (
              <button
                type="button"
                className="category-search-clear"
                onClick={() => onSearchInputChange("")}
                aria-label="Clear search"
              >
                <i className="ti ti-x" />
              </button>
            ) : null}
          </div>
          <label
            className="category-toolbar-label"
            htmlFor="category-needs-review-only"
          >
            <input
              id="category-needs-review-only"
              type="checkbox"
              checked={needsReviewOnly}
              disabled={isSearching}
              onChange={(event) => onToggleNeedsReviewOnly(event.target.checked)}
            />{" "}
            Needs review only
          </label>
          <label className="category-toolbar-label" htmlFor="category-language">
            Language
          </label>
          <select
            id="category-language"
            value={language}
            onChange={(event) =>
              onLanguageChange(event.target.value as CategoryLanguage)
            }
          >
            <option value="en">English</option>
            <option value="am">Amharic</option>
          </select>
        </div>
      </div>

      <div className="category-stat-grid">
        <div className="category-stat">
          <div className="ml">Visible Rows</div>
          <div className="category-stat-value">{categories.length}</div>
        </div>
        <div className="category-stat">
          <div className="ml">Root Categories</div>
          <div className="category-stat-value">{rootCount}</div>
        </div>
        <div className="category-stat">
          <div className="ml">Sub-categories</div>
          <div className="category-stat-value">{childCount}</div>
        </div>
        <div className="category-stat">
          <div className="ml">{isSearching ? "Matches (Total)" : "Root Categories (Total)"}</div>
          <div className="category-stat-value">{total}</div>
        </div>
        <div className="category-stat">
          <div className="ml">Needs Review</div>
          <div className="category-stat-value">{needsReviewCount}</div>
        </div>
      </div>

      {selectedIds.size > 0 ? (
        <div className="category-action-panel">
          <div className="category-action-summary">
            <div className="category-action-title">
              {selectedIds.size} categor{selectedIds.size === 1 ? "y" : "ies"} selected
            </div>
            <div className="category-action-buttons">
              <button type="button" className="btn sm" onClick={onBulkEdit}>
                <i className="ti ti-edit" />
                Update selected
              </button>
              <button type="button" className="btn d sm" onClick={onBulkDelete}>
                <i className="ti ti-trash" />
                Delete selected
              </button>
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => onToggleSelectAll([])}
              >
                Clear selection
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <GlassCard flat className="card-dark category-table-shell">
        {loading ? (
          <div className="category-empty">Loading categories…</div>
        ) : flattened.length === 0 ? (
          <div className="category-empty">
            {isSearching
              ? `No categories match "${searchInput}".`
              : "No categories found for the current page."}
          </div>
        ) : (
          <table>
            <colgroup>
              <col style={{ width: "40px" }} />
              <col style={{ width: "76px" }} />
              <col style={{ width: "38%" }} />
              <col style={{ width: "27%" }} />
              <col style={{ width: "21%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>
                  <SelectAllCheckbox
                    checked={allVisibleSelected}
                    indeterminate={someVisibleSelected}
                    onChange={() => onToggleSelectAll(visibleIds)}
                  />
                </th>
                <th>Icon</th>
                <th>Display Name</th>
                <th>Slug</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {flattened.map(({ category, depth }) => (
                <tr
                  key={category.id}
                  className={
                    [
                      depth > 0 ? "category-row-child" : "",
                      selectedIds.has(category.id) ? "category-row-selected" : "",
                    ]
                      .filter(Boolean)
                      .join(" ") || undefined
                  }
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(category.id)}
                      onChange={() => onToggleSelect(category.id)}
                      aria-label={`Select ${getLocalizedName(category, language)}`}
                    />
                  </td>
                  <td>
                    <div
                      className={`category-icon-cell ${
                        depth > 0 ? "category-icon-cell-child" : ""
                      }`}
                    >
                      <i className={resolveIconClass(category.icon)} />
                      <span className="mono">{category.icon || "—"}</span>
                      {depth > 0 ? (
                        <span className="category-subtree-badge">Sub-tree</span>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <div
                      className={`category-name-stack ${
                        depth > 0 ? "category-name-stack-child" : ""
                      }`}
                      style={{ paddingLeft: `${depth * 26}px` }}
                    >
                      <span className="category-name-line">
                        {depth > 0 ? (
                          <span className="category-indent-marker">↳</span>
                        ) : null}
                        <strong>{getLocalizedName(category, language)}</strong>
                        {category.needsReview ? (
                          <span
                            className="category-needs-review-badge"
                            title="Auto-created by the ingest pipeline from an AI-extracted category — confirm this is correct."
                          >
                            <i className="ti ti-alert-triangle" />
                            Needs review
                          </span>
                        ) : null}
                      </span>
                      <span className="csub">
                        {language === "en"
                          ? category.name.am || "No Amharic translation"
                          : category.name.en || "No English translation"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="mono">{category.slug}</span>
                  </td>
                  <td>
                    <div className="row-act">
                      {category.needsReview ? (
                        <button
                          type="button"
                          className="btn sm"
                          disabled={markingReviewedId === category.id}
                          onClick={() => onMarkReviewed(category)}
                        >
                          <i className="ti ti-check" />
                          {markingReviewedId === category.id
                            ? "Marking…"
                            : "Mark Reviewed"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="btn sm"
                        onClick={() => onEdit(category)}
                      >
                        <i className="ti ti-edit" />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn d sm"
                        onClick={() => onDelete(category)}
                      >
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
      </GlassCard>

      <div className="category-pagination">
        <div className="category-pagination-summary">
          {isSearching ? (
            <>Showing matches {pageStart}-{pageEnd} of {total}</>
          ) : (
            <>
              Showing root categories {pageStart}-{pageEnd} of {total}
              <span className="csub">
                {" "}
                · sub-categories are always shown with their parent
              </span>
            </>
          )}
        </div>
        <div className="category-pagination-controls">
          <label className="category-toolbar-label" htmlFor="category-limit">
            Roots per page
          </label>
          <select
            id="category-limit"
            value={limit}
            onChange={(event) => onLimitChange(Number(event.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <button
            type="button"
            className="btn sm"
            disabled={!canGoBack}
            onClick={() => onOffsetChange(Math.max(0, offset - limit))}
          >
            <i className="ti ti-chevron-left" />
            Prev
          </button>
          <button
            type="button"
            className="btn sm"
            disabled={!canGoNext}
            onClick={() => onOffsetChange(offset + limit)}
          >
            Next
            <i className="ti ti-chevron-right" />
          </button>
        </div>
      </div>
    </div>
  );
}
