"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  deleteCategory,
  fetchCategories,
  fetchCategoriesNeedingReview,
  fetchParentCategories,
  flattenCategoryTree,
  mapSearchResults,
  markCategoryReviewed,
  updateCategory,
} from "../../api";
import type {
  Category,
  CategoryFormValues,
  CategoryLanguage,
} from "../../types";
import CategoryStructureSection from "./CategoryStructureSection";
import ActionModals from "../action-modals/ActionModals";
import { GlassCard } from "@/features/shared/GlassCard";

export default function CategoryStructurePage() {
  return (
    <Suspense fallback={<div className="category-empty">Loading categories…</div>}>
      <CategoryStructurePageInner />
    </Suspense>
  );
}

function CategoryStructurePageInner() {
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const [language, setLanguage] = useState<CategoryLanguage>("en");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null,
  );
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [needsReviewOnly, setNeedsReviewOnly] = useState(false);
  const [needsReviewCount, setNeedsReviewCount] = useState(0);
  const [markingReviewedId, setMarkingReviewedId] = useState<string | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [flagged, parents] = await Promise.all([
        fetchCategoriesNeedingReview(),
        fetchParentCategories(),
      ]);
      setNeedsReviewCount(flagged.length);
      setParentCategories(parents);

      if (search.trim()) {
        const paged = await fetchCategories(limit, offset, search);
        setCategories(mapSearchResults(paged.data));
        setTotal(paged.total);
      } else if (needsReviewOnly) {
        setCategories(flagged);
        setTotal(flagged.length);
      } else {
        const paged = await fetchCategories(limit, offset);
        setCategories(flattenCategoryTree(paged.data));
        setTotal(paged.total);
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load categories right now.",
      );
    } finally {
      setLoading(false);
    }
  }, [limit, offset, needsReviewOnly, search]);

  useEffect(() => {
    const run = async () => {
      await load();
    };

    void run();
  }, [load]);

  // Debounce the free-text search box before it drives a real fetch.
  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput);
      setOffset(0);
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const handleMarkReviewed = useCallback(
    async (category: Category) => {
      setMarkingReviewedId(category.id);
      setError(null);

      try {
        await markCategoryReviewed(category.id);
        setFeedback(`"${category.slug}" marked as reviewed.`);
        await load();
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Failed to mark category as reviewed.",
        );
      } finally {
        setMarkingReviewedId(null);
      }
    },
    [load],
  );

  const handleSave = useCallback(
    async (id: string, values: CategoryFormValues) => {
      if (!editingCategory) {
        setError("No category selected for editing.");
        return;
      }

      setEditing(true);
      setError(null);

      try {
        await updateCategory(id, values, editingCategory);
        setEditingCategory(null);
        setFeedback("Category updated successfully.");
        await load();
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Failed to update category.",
        );
      } finally {
        setEditing(false);
      }
    },
    [editingCategory, load],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setDeleting(true);
      setError(null);

      try {
        await deleteCategory(id);
        setDeletingCategory(null);
        setFeedback("Category deleted successfully.");

        const remainingItemsOnPage = Math.max(categories.length - 1, 0);
        if (remainingItemsOnPage === 0 && offset > 0) {
          setOffset((current) => Math.max(0, current - limit));
        } else {
          await load();
        }
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Failed to delete category.",
        );
      } finally {
        setDeleting(false);
      }
    },
    [categories.length, limit, load, offset],
  );

  return (
    <div>
      <div
        className="page-hd"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div>
          <h2>Category Structure Table/Tree</h2>
          <p>
            Browse the full category hierarchy fetched from{" "}
            <span className="mono">GET /api/v1/categories</span>.
          </p>
        </div>
        <button type="button" className="btn sm" onClick={() => void load()}>
          <i className="ti ti-refresh" />
          Refresh
        </button>
      </div>

      {needsReviewCount > 0 ? (
        <div className="category-feedback category-review-banner">
          <i className="ti ti-alert-triangle" />
          {needsReviewCount} categor{needsReviewCount === 1 ? "y" : "ies"} auto-created by
          the ingest pipeline {needsReviewCount === 1 ? "needs" : "need"} review — the
          AI-extracted name/slug may not be correct.
          <button
            type="button"
            className="btn sm"
            onClick={() => setNeedsReviewOnly(true)}
            disabled={needsReviewOnly}
          >
            Show only these
          </button>
        </div>
      ) : null}

      {feedback ? <div className="category-feedback">{feedback}</div> : null}
      {error ? <div className="category-inline-error">{error}</div> : null}

      <GlassCard flat className="card">
        <CategoryStructureSection
          categories={categories}
          total={total}
          limit={limit}
          offset={offset}
          language={language}
          loading={loading}
          needsReviewOnly={needsReviewOnly}
          needsReviewCount={needsReviewCount}
          markingReviewedId={markingReviewedId}
          searchInput={searchInput}
          isSearching={search.trim().length > 0}
          onSearchInputChange={setSearchInput}
          onLanguageChange={setLanguage}
          onLimitChange={(nextLimit) => {
            setLimit(nextLimit);
            setOffset(0);
          }}
          onOffsetChange={setOffset}
          onToggleNeedsReviewOnly={(next) => {
            setNeedsReviewOnly(next);
            setOffset(0);
          }}
          onEdit={setEditingCategory}
          onDelete={setDeletingCategory}
          onMarkReviewed={handleMarkReviewed}
        />
      </GlassCard>

      <ActionModals
        editingCategory={editingCategory}
        deletingCategory={deletingCategory}
        parentCategories={parentCategories}
        editing={editing}
        deleting={deleting}
        onCloseEdit={() => setEditingCategory(null)}
        onCloseDelete={() => setDeletingCategory(null)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
