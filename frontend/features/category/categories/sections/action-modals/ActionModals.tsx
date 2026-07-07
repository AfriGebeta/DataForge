"use client";

import EditCategoryModal from "./EditCategoryModal";
import DeleteCategoryModal from "./DeleteCategoryModal";
import type { Category, CategoryFormValues } from "../../types";

type ActionModalsProps = {
  editingCategory: Category | null;
  deletingCategory: Category | null;
  rootCategories: Category[];
  editing: boolean;
  deleting: boolean;
  onCloseEdit: () => void;
  onCloseDelete: () => void;
  onSave: (id: string, values: CategoryFormValues) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export default function ActionModals({
  editingCategory,
  deletingCategory,
  rootCategories,
  editing,
  deleting,
  onCloseEdit,
  onCloseDelete,
  onSave,
  onDelete,
}: ActionModalsProps) {
  return (
    <>
      {editingCategory ? (
        <EditCategoryModal
          key={editingCategory.id}
          category={editingCategory}
          rootCategories={rootCategories}
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
    </>
  );
}
