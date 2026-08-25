"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  bulkDeleteCategories,
  bulkUpdateCategories,
  deleteCategory,
  fetchCategories,
  fetchCategoriesNeedingReview,
  fetchParentCategories,
  flattenCategoryTree,
  mapSearchResults,
  markCategoryReviewed,
  mergeCategories,
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [mergingCategory, setMergingCategory] = useState<Category | null>(null);
  const [mergeDefaultTargetId, setMergeDefaultTargetId] = useState<
    string | undefined
  >(undefined);
  const [merging, setMerging] = useState(false);

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

  // Selection is scoped to whatever's currently loaded — derived at render
  // time (not synced via an effect+setState) so a page/filter change or a
  // delete that drops rows out of `categories` can't leave a stale selected
  // id silently pointed at a bulk action the admin can no longer even see.
  // `selectedIds` itself may still hold ids that just scrolled out of view;
  // this is the only value ever read for display/bulk-action purposes.
  const visibleSelectedIds = useMemo(() => {
    const loadedIds = new Set(categories.map((c) => c.id));
    return new Set([...selectedIds].filter((id) => loadedIds.has(id)));
  }, [selectedIds, categories]);

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
        setNeedsReviewCount((current) => Math.max(0, current - 1));
        // Update in place instead of re-fetching everything — a full
        // reload flashes the whole table back to a loading state for one
        // row's flag flip.
        if (needsReviewOnly) {
          setCategories((current) => current.filter((c) => c.id !== category.id));
          setTotal((current) => Math.max(0, current - 1));
        } else {
          setCategories((current) =>
            current.map((c) => (c.id === category.id ? { ...c, needsReview: false } : c)),
          );
        }
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
    [needsReviewOnly],
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

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Called with every currently-visible row's id to select them all, or
  // with `[]` to clear — same "select all / clear" toggle DataTable-based
  // pages use, just expressed as one function since this table isn't built
  // on that shared component.
  const handleToggleSelectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(visibleSelectedIds);
    if (ids.length === 0) return;

    setBulkSubmitting(true);
    setError(null);

    try {
      await bulkDeleteCategories(ids);
      setBulkDeleteOpen(false);
      setSelectedIds(new Set());
      setFeedback(`${ids.length} categor${ids.length === 1 ? "y" : "ies"} deleted successfully.`);

      const remainingItemsOnPage = Math.max(categories.length - ids.length, 0);
      if (remainingItemsOnPage === 0 && offset > 0) {
        setOffset((current) => Math.max(0, current - limit));
      } else {
        await load();
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Failed to delete selected categories.",
      );
    } finally {
      setBulkSubmitting(false);
    }
  }, [visibleSelectedIds, categories.length, limit, load, offset]);

  const handleBulkSave = useCallback(
    async (patch: { parentId?: string | null; needsReview?: boolean }) => {
      const ids = Array.from(visibleSelectedIds);
      if (ids.length === 0) return;

      setBulkSubmitting(true);
      setError(null);

      try {
        await bulkUpdateCategories(ids, patch);
        setBulkEditOpen(false);
        setSelectedIds(new Set());
        setFeedback(`${ids.length} categor${ids.length === 1 ? "y" : "ies"} updated successfully.`);
        await load();
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Failed to update selected categories.",
        );
      } finally {
        setBulkSubmitting(false);
      }
    },
    [visibleSelectedIds, load],
  );

  const handleOpenMerge = useCallback((category: Category) => {
    setMergeDefaultTargetId(undefined);
    setMergingCategory(category);
  }, []);

  // Only meaningful with exactly 2 rows checked — the bulk-action bar only
  // renders this button in that case. Picks one as the modal's `source`
  // (deleted) and pre-selects the other as the default merge target
  // (survivor); the admin can still flip the target dropdown to any other
  // category before confirming.
  const handleOpenBulkMerge = useCallback(() => {
    const ids = Array.from(visibleSelectedIds);
    if (ids.length !== 2) return;

    const [sourceId, defaultTargetId] = ids;
    const sourceCategory = categories.find((c) => c.id === sourceId);
    if (!sourceCategory) return;

    setMergeDefaultTargetId(defaultTargetId);
    setMergingCategory(sourceCategory);
  }, [visibleSelectedIds, categories]);

  const handleCloseMerge = useCallback(() => {
    setMergingCategory(null);
    setMergeDefaultTargetId(undefined);
  }, []);

  const handleMergeConfirm = useCallback(
    async (targetId: string) => {
      if (!mergingCategory) return;

      setMerging(true);
      setError(null);

      try {
        const result = await mergeCategories(mergingCategory.id, targetId);
        const mergedSlug = mergingCategory.slug;
        setMergingCategory(null);
        setMergeDefaultTargetId(undefined);
        setSelectedIds(new Set());
        setFeedback(
          `Merged "${mergedSlug}" — moved ${result.movedPlaces} place${
            result.movedPlaces === 1 ? "" : "s"
          } and ${result.movedChildren} sub-categor${
            result.movedChildren === 1 ? "y" : "ies"
          } into the surviving category.`,
        );
        await load();
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Failed to merge categories.",
        );
      } finally {
        setMerging(false);
      }
    },
    [mergingCategory, load],
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
          onMerge={handleOpenMerge}
          selectedIds={visibleSelectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onBulkEdit={() => setBulkEditOpen(true)}
          onBulkDelete={() => setBulkDeleteOpen(true)}
          onBulkMerge={handleOpenBulkMerge}
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
        bulkEditIds={bulkEditOpen ? Array.from(visibleSelectedIds) : null}
        bulkDeleteIds={bulkDeleteOpen ? Array.from(visibleSelectedIds) : null}
        bulkSubmitting={bulkSubmitting}
        onCloseBulkEdit={() => setBulkEditOpen(false)}
        onCloseBulkDelete={() => setBulkDeleteOpen(false)}
        onBulkSave={handleBulkSave}
        onBulkDelete={handleBulkDelete}
        mergingCategory={mergingCategory}
        mergeDefaultTargetId={mergeDefaultTargetId}
        merging={merging}
        onCloseMerge={handleCloseMerge}
        onMerge={handleMergeConfirm}
      />
    </div>
  );
}
