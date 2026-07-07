"use client";

import { useState } from "react";
import CategoryFormFields from "../add-category-form/CategoryFormFields";
import { createSlug, makeInitialFormValues } from "../../api";
import type { Category, CategoryFormValues } from "../../types";

type EditCategoryModalProps = {
  category: Category;
  rootCategories: Category[];
  submitting: boolean;
  onClose: () => void;
  onSave: (id: string, values: CategoryFormValues) => Promise<void>;
};

export default function EditCategoryModal({
  category,
  rootCategories,
  submitting,
  onClose,
  onSave,
}: EditCategoryModalProps) {
  const [values, setValues] = useState<CategoryFormValues>(
    makeInitialFormValues(category),
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

  const enableSlugSync = () => {
    setSlugDirty(false);
    setValues((current) => ({
      ...current,
      slug: createSlug(current.nameEn),
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (values.slug.trim().length < 2) {
      setValidationError("Slug must be at least 2 characters.");
      return;
    }

    await onSave(category.id, values);
  };

  return (
    <div
      className="category-modal-backdrop"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        className="category-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-category-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="category-modal-header">
          <div>
            <div className="ct" id="edit-category-title">
              Section C · Edit Category
            </div>
            <div className="csub">
              Update the selected category. Clearing the icon field sends an
              empty string.
            </div>
          </div>
          <button type="button" className="btn ghost sm" onClick={onClose}>
            <i className="ti ti-x" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <CategoryFormFields
            values={values}
            onChange={updateField}
            rootCategories={rootCategories}
            excludeCategoryId={category.id}
          />

          <div className="category-sync-row">
            <button type="button" className="btn sm" onClick={enableSlugSync}>
              <i className="ti ti-wand" />
              Regenerate slug from English name
            </button>
          </div>

          {validationError ? (
            <div className="category-inline-error">{validationError}</div>
          ) : null}

          <div className="category-modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn p" disabled={submitting}>
              <i className="ti ti-device-floppy" />
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
