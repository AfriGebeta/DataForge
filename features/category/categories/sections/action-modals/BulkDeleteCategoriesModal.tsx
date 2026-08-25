"use client";

type BulkDeleteCategoriesModalProps = {
  count: number;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export default function BulkDeleteCategoriesModal({
  count,
  submitting,
  onClose,
  onConfirm,
}: BulkDeleteCategoriesModalProps) {
  return (
    <div className="category-modal-backdrop" onClick={onClose} aria-hidden="true">
      <div
        className="category-modal category-modal-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-delete-category-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="category-modal-header">
          <div>
            <div className="ct" id="bulk-delete-category-title">
              Section C · Bulk Delete Confirmation
            </div>
            <div className="csub">This permanently deletes every selected category.</div>
          </div>
          <button type="button" className="btn ghost sm" onClick={onClose}>
            <i className="ti ti-x" />
          </button>
        </div>

        <div className="category-delete-copy">
          <p>
            Are you sure you want to delete <strong>{count}</strong> categor
            {count === 1 ? "y" : "ies"}?
          </p>
          <p className="category-danger-text">
            This calls <span className="mono">DELETE /api/v1/categories/bulk</span>. Any
            sub-categories or places under these will fall back to
            root/uncategorized rather than being deleted themselves.
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
            onClick={() => void onConfirm()}
          >
            <i className="ti ti-trash" />
            {submitting ? "Deleting..." : `Delete ${count} Categor${count === 1 ? "y" : "ies"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
