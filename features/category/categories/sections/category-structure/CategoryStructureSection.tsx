"use client";

import { getLocalizedName } from "../../api";
import type { Category, CategoryLanguage } from "../../types";
import { GlassCard } from "@/features/shared/GlassCard";

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
  onLanguageChange: (language: CategoryLanguage) => void;
  onLimitChange: (limit: number) => void;
  onOffsetChange: (offset: number) => void;
  onToggleNeedsReviewOnly: (next: boolean) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onMarkReviewed: (category: Category) => void;
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
  onLanguageChange,
  onLimitChange,
  onOffsetChange,
  onToggleNeedsReviewOnly,
  onEdit,
  onDelete,
  onMarkReviewed,
}: CategoryStructureSectionProps) {
  const flattened = flattenCategories(categories);
  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + limit, total);
  const canGoBack = offset > 0;
  const canGoNext = offset + limit < total;
  const rootCount = categories.filter((category) => !category.parentId).length;
  const childCount = categories.length - rootCount;

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
          <label
            className="category-toolbar-label"
            htmlFor="category-needs-review-only"
          >
            <input
              id="category-needs-review-only"
              type="checkbox"
              checked={needsReviewOnly}
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
          <div className="ml">Root Categories (Total)</div>
          <div className="category-stat-value">{total}</div>
        </div>
        <div className="category-stat">
          <div className="ml">Needs Review</div>
          <div className="category-stat-value">{needsReviewCount}</div>
        </div>
      </div>

      <GlassCard flat className="card-dark category-table-shell">
        {loading ? (
          <div className="category-empty">Loading categories…</div>
        ) : flattened.length === 0 ? (
          <div className="category-empty">
            No categories found for the current page.
          </div>
        ) : (
          <table>
            <colgroup>
              <col style={{ width: "80px" }} />
              <col style={{ width: "40%" }} />
              <col style={{ width: "28%" }} />
              <col style={{ width: "22%" }} />
            </colgroup>
            <thead>
              <tr>
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
                  className={depth > 0 ? "category-row-child" : undefined}
                >
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
          Showing root categories {pageStart}-{pageEnd} of {total}
          <span className="csub">
            {" "}
            · sub-categories are always shown with their parent
          </span>
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
