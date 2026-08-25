"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CategoryApiError,
  createCategory,
  fetchCategoryBySlug,
  fetchParentCategories,
  getLocalizedName,
} from "../../api";
import type { Category, CategoryFormValues } from "../../types";
import AddCategorySection from "./AddCategorySection";
import { GlassCard } from "@/features/shared/GlassCard";

export default function NewCategoryPage() {
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [loadingRoots, setLoadingRoots] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<Category | null>(null);
  const [formResetKey, setFormResetKey] = useState(0);

  const loadRoots = useCallback(async () => {
    setLoadingRoots(true);
    setError(null);

    try {
      const parents = await fetchParentCategories();
      setParentCategories(parents);
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
      setConflict(null);

      try {
        await createCategory(values);
        setFeedback("Category created successfully.");
        setFormResetKey((current) => current + 1);
        await loadRoots();
      } catch (cause) {
        if (cause instanceof CategoryApiError && cause.status === 409) {
          const existing = await fetchCategoryBySlug(values.slug.trim());
          if (existing) {
            setConflict(existing);
            setError(null);
          } else {
            setError(cause.message);
          }
        } else {
          setError(
            cause instanceof Error ? cause.message : "Failed to create category.",
          );
        }
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
          Create top-level categories or nest them under any existing category
          depth via <span className="mono">POST /api/v1/categories</span>.
        </p>
      </div>

      {feedback ? <div className="category-feedback">{feedback}</div> : null}
      {error ? <div className="category-inline-error">{error}</div> : null}
      {conflict ? (
        <div className="category-inline-error">
          A category with slug <span className="mono">&ldquo;{conflict.slug}&rdquo;</span>{" "}
          already exists: <strong>{getLocalizedName(conflict, "en")}</strong>
          {conflict.needsReview ? " (auto-created, needs review)" : ""}. Pick a
          different slug, or{" "}
          <Link href={`/category/structure?search=${encodeURIComponent(conflict.slug)}`}>
            open it in Category Structure
          </Link>{" "}
          to edit or delete it.
        </div>
      ) : null}

      <GlassCard flat className="card category-form-card">
        {loadingRoots ? (
          <div className="category-empty category-empty-compact">
            Loading parent categories…
          </div>
        ) : (
          <AddCategorySection
            key={formResetKey}
            parentCategories={parentCategories}
            submitting={submitting}
            onCreate={handleCreate}
          />
        )}
      </GlassCard>
    </div>
  );
}
