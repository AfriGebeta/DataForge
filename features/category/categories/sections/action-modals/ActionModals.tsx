"use client";

import EditCategoryModal from "./EditCategoryModal";
import DeleteCategoryModal from "./DeleteCategoryModal";
import BulkEditCategoryModal from "./BulkEditCategoryModal";
import BulkDeleteCategoriesModal from "./BulkDeleteCategoriesModal";
import type { Category, CategoryFormValues } from "../../types";

type ActionModalsProps = {
  editingCategory: Category | null;
  deletingCategory: Category | null;
  parentCategories: Category[];
  editing: boolean;
  deleting: boolean;
  onCloseEdit: () => void;
  onCloseDelete: () => void;
  onSave: (id: string, values: CategoryFormValues) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  bulkEditIds: string[] | null;
  bulkDeleteIds: string[] | null;
  bulkSubmitting: boolean;
  onCloseBulkEdit: () => void;
  onCloseBulkDelete: () => void;
  onBulkSave: (patch: { parentId?: string | null; needsReview?: boolean }) => Promise<void>;
  onBulkDelete: () => Promise<void>;
};

export default function ActionModals({
  editingCategory,
  deletingCategory,
  parentCategories,
  editing,
  deleting,
  onCloseEdit,
  onCloseDelete,
  onSave,
  onDelete,
  bulkEditIds,
  bulkDeleteIds,
  bulkSubmitting,
  onCloseBulkEdit,
  onCloseBulkDelete,
  onBulkSave,
  onBulkDelete,
}: ActionModalsProps) {
  return (
    <>
      {editingCategory ? (
        <EditCategoryModal
          key={editingCategory.id}
          category={editingCategory}
          parentCategories={parentCategories}
          submitting={editing}
          onClose={onCloseEdit}
          onSave={onSave}
        />
      ) : null}

      {deletingCategory ? (
        <DeleteCategoryModal
          category={deletingCategory}
          submitting={deleting}
          onClose={onCloseDelete}
          onConfirm={onDelete}
        />
      ) : null}

      {bulkEditIds ? (
        <BulkEditCategoryModal
          count={bulkEditIds.length}
          parentCategories={parentCategories}
          excludeCategoryIds={bulkEditIds}
          submitting={bulkSubmitting}
          onClose={onCloseBulkEdit}
          onSave={onBulkSave}
        />
      ) : null}

      {bulkDeleteIds ? (
        <BulkDeleteCategoriesModal
          count={bulkDeleteIds.length}
          submitting={bulkSubmitting}
          onClose={onCloseBulkDelete}
          onConfirm={onBulkDelete}
        />
      ) : null}
    </>
  );
}
