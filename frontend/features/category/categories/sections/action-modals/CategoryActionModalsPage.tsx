"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteCategory,
  fetchCategories,
  fetchRootCategories,
  getLocalizedName,
  updateCategory,
} from "../../api";
import type { Category, CategoryFormValues } from "../../types";
import EditCategoryModal from "./EditCategoryModal";
import DeleteCategoryModal from "./DeleteCategoryModal";

export default function CategoryActionModalsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [rootCategories, setRootCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
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
      const [paged, roots] = await Promise.all([
        fetchCategories(250, 0),
        fetchRootCategories(),
      ]);

      const visible = paged.data.filter((category) => !category.deletedAt);
      setCategories(visible);
      setRootCategories(roots);
      setSelectedId((current) => {
        if (current && visible.some((category) => category.id === current)) {
          return current;
        }
        return visible[0]?.id ?? "";
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load categories right now.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      await load();
    };

    void run();
  }, [load]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedId) ?? null,
    [categories, selectedId],
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
        setFeedback(`Category updated via PUT /api/v1/categories/${id}.`);
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
        setFeedback(
          `Category soft-deleted via DELETE /api/v1/categories/${id}.`,
        );
        await load();
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Failed to delete category.",
        );
      } finally {
        setDeleting(false);
      }
    },
    [load],
  );

  return (
    <div>
      <div className="page-hd">
        <h2>Action Modals (Edit & Delete)</h2>
        <p>
          Pick a category by ID, then open the edit or delete confirmation
          dialog for it.
        </p>
      </div>

      {feedback ? <div className="category-feedback">{feedback}</div> : null}
      {error ? <div className="category-inline-error">{error}</div> : null}

      <div className="card">
        {loading ? (
          <div className="category-empty">Loading categories…</div>
        ) : categories.length === 0 ? (
          <div className="category-empty">No categories available yet.</div>
        ) : (
          <>
            <div className="fg category-action-picker">
              <label className="fl" htmlFor="category-action-select">
                Selected Category
              </label>
              <select
                id="category-action-select"
                value={selectedId}
                onChange={(event) => setSelectedId(event.target.value)}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {getLocalizedName(category, "en")} — {category.slug}
                  </option>
                ))}
              </select>
            </div>

            {selectedCategory ? (
              <div className="category-action-panel">
                <div className="category-action-summary">
                  <div className="ml">Category ID</div>
                  <div className="mono">{selectedCategory.id}</div>
                  <div className="category-action-title">
                    {getLocalizedName(selectedCategory, "en")}
                  </div>
                  <div className="csub">
                    Slug: <span className="mono">{selectedCategory.slug}</span>
                  </div>
                </div>

                <div className="category-action-buttons">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setEditingCategory(selectedCategory)}
                  >
                    <i className="ti ti-edit" />
                    Open Edit Modal
                  </button>
                  <button
                    type="button"
                    className="btn d"
                    onClick={() => setDeletingCategory(selectedCategory)}
                  >
                    <i className="ti ti-trash" />
                    Open Delete Confirmation
                  </button>
                </div>

                <div className="category-notes">
                  <div className="category-note-item">
                    <span className="chip ac">PUT</span>
                    The edit modal pre-fills these fields from the selected
                    category ID and saves via{" "}
                    <span className="mono">
                      PUT /api/v1/categories/{selectedCategory.id}
                    </span>
                    . Clearing the icon field sends an empty string.
                  </div>
                  <div className="category-note-item">
                    <span className="chip hi">DELETE</span>
                    Delete requires confirmation first, then calls{" "}
                    <span className="mono">
                      DELETE /api/v1/categories/{selectedCategory.id}
                    </span>{" "}
                    to soft-delete the record.
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      {editingCategory ? (
        <EditCategoryModal
          key={editingCategory.id}
          category={editingCategory}
          rootCategories={rootCategories}
          submitting={editing}
          onClose={() => setEditingCategory(null)}
          onSave={handleSave}
        />
      ) : null}

      {deletingCategory ? (
        <DeleteCategoryModal
          category={deletingCategory}
          submitting={deleting}
          onClose={() => setDeletingCategory(null)}
          onConfirm={handleDelete}
        />
      ) : null}
    </div>
  );
}
