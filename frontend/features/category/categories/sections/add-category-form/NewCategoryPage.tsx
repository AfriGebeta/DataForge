"use client";

import { useCallback, useEffect, useState } from "react";
import { createCategory, fetchRootCategories } from "../../api";
import type { Category, CategoryFormValues } from "../../types";
import AddCategorySection from "./AddCategorySection";

export default function NewCategoryPage() {
  const [rootCategories, setRootCategories] = useState<Category[]>([]);
  const [loadingRoots, setLoadingRoots] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formResetKey, setFormResetKey] = useState(0);

  const loadRoots = useCallback(async () => {
    setLoadingRoots(true);
    setError(null);

    try {
      const roots = await fetchRootCategories();
      setRootCategories(roots);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load parent categories right now.",
      );
    } finally {
      setLoadingRoots(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      await loadRoots();
    };

    void run();
  }, [loadRoots]);

  const handleCreate = useCallback(
    async (values: CategoryFormValues) => {
      setSubmitting(true);
      setError(null);

      try {
        await createCategory(values);
        setFeedback("Category created successfully.");
        setFormResetKey((current) => current + 1);
        await loadRoots();
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Failed to create category.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [loadRoots],
  );

  return (
    <div>
      <div className="page-hd">
        <h2>New Category</h2>
        <p>
          Create top-level categories or nest them under an existing root
          category via <span className="mono">POST /api/v1/categories</span>.
        </p>
      </div>

      {feedback ? <div className="category-feedback">{feedback}</div> : null}
      {error ? <div className="category-inline-error">{error}</div> : null}

      <div className="card category-form-card">
        {loadingRoots ? (
          <div className="category-empty category-empty-compact">
            Loading parent categories…
          </div>
        ) : (
          <AddCategorySection
            key={formResetKey}
            rootCategories={rootCategories}
            submitting={submitting}
            onCreate={handleCreate}
          />
        )}
      </div>
    </div>
  );
}
