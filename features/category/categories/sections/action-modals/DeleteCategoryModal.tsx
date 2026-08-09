"use client";

import { getLocalizedName } from "../../api";
import type { Category } from "../../types";

type DeleteCategoryModalProps = {
  category: Category;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
};

export default function DeleteCategoryModal({
  category,
  submitting,
  onClose,
  onConfirm,
}: DeleteCategoryModalProps) {
  return (
    <div className="category-modal-backdrop" onClick={onClose} aria-hidden="true">
      <div
        className="category-modal category-modal-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-category-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="category-modal-header">
          <div>
            <div className="ct" id="delete-category-title">
              Section C · Delete Confirmation
            </div>
            <div className="csub">This permanently deletes the category from the database.</div>
          </div>
          <button type="button" className="btn ghost sm" onClick={onClose}>
            <i className="ti ti-x" />
          </button>
        </div>

        <div className="category-delete-copy">
          <p>
            Are you sure you want to delete <strong>{getLocalizedName(category, "en")}</strong>?
          </p>
          <p className="category-danger-text">
            This will call <span className="mono">DELETE /api/v1/categories/{category.id}</span>.
          </p>
        </div>

        <div className="category-modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn d"
            disabled={submitting}
            onClick={() => void onConfirm(category.id)}
          >
            <i className="ti ti-trash" />
            {submitting ? "Deleting..." : "Delete Category"}
          </button>
        </div>
      </div>
    </div>
  );
}
