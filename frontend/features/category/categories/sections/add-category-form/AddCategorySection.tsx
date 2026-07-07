"use client";

import { useState } from "react";
import CategoryFormFields from "./CategoryFormFields";
import { createSlug, makeInitialFormValues } from "../../api";
import type { Category, CategoryFormValues } from "../../types";

type AddCategorySectionProps = {
  rootCategories: Category[];
  submitting: boolean;
  onCreate: (values: CategoryFormValues) => Promise<void>;
};

export default function AddCategorySection({
  rootCategories,
  submitting,
  onCreate,
}: AddCategorySectionProps) {
  const [values, setValues] = useState<CategoryFormValues>(
    makeInitialFormValues(),
  );
  const [slugDirty, setSlugDirty] = useState(false);
  const [validationError, setValidationError] = useState("");

  const updateField = <K extends keyof CategoryFormValues>(
    field: K,
    value: CategoryFormValues[K],
  ) => {
    setValues((current) => {
      const next = { ...current, [field]: value };

      if (field === "nameEn" && !slugDirty) {
        next.slug = createSlug(String(value));
      }

      return next;
    });

    if (field === "slug") {
      setSlugDirty(true);
    }

    if (validationError) {
      setValidationError("");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (values.slug.trim().length < 2) {
      setValidationError("Slug must be at least 2 characters.");
      return;
    }

    await onCreate(values);
  };

  return (
    <div>
      <div className="ch">
        <div>
          <div className="ct">Section B · New Category</div>
          <div className="csub">
            Create top-level categories or nest them under an existing root
            category.
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <CategoryFormFields
          values={values}
          onChange={updateField}
          rootCategories={rootCategories}
        />

        {validationError ? (
          <div className="category-inline-error">{validationError}</div>
        ) : null}

        <div className="category-form-actions">
          <button type="submit" className="btn p" disabled={submitting}>
            <i className="ti ti-plus" />
            {submitting ? "Creating..." : "Create Category"}
          </button>
        </div>
      </form>
    </div>
  );
}
