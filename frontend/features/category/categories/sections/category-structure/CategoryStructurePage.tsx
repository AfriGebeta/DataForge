"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteCategory,
  fetchCategories,
  fetchParentCategories,
  updateCategory,
} from "../../api";
import type {
  Category,
  CategoryFormValues,
  CategoryLanguage,
} from "../../types";
import CategoryStructureSection from "./CategoryStructureSection";
import ActionModals from "../action-modals/ActionModals";

export default function CategoryStructurePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [paged, parents] = await Promise.all([
        fetchCategories(limit, offset),
        fetchParentCategories(),
      ]);

      setCategories(paged.data.filter((category) => !category.deletedAt));
      setTotal(paged.total);
      setParentCategories(parents);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load categories right now.",
      );
    } finally {
      setLoading(false);
    }
  }, [limit, offset]);

  useEffect(() => {
    const run = async () => {
      await load();
    };

    void run();
  }, [load]);

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

      {feedback ? <div className="category-feedback">{feedback}</div> : null}
      {error ? <div className="category-inline-error">{error}</div> : null}

      <div className="card">
        <CategoryStructureSection
          categories={categories}
          total={total}
          limit={limit}
          offset={offset}
          language={language}
          loading={loading}
          onLanguageChange={setLanguage}
          onLimitChange={(nextLimit) => {
            setLimit(nextLimit);
            setOffset(0);
          }}
          onOffsetChange={setOffset}
          onEdit={setEditingCategory}
          onDelete={setDeletingCategory}
        />
      </div>

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
