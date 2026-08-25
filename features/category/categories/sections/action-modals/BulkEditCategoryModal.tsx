"use client";

import { useState } from "react";
import type { Category } from "../../types";

type BulkEditCategoryModalProps = {
  count: number;
  parentCategories: Category[];
  /** Every selected category's id — excluded (along with their descendants) from the parent picker so a category can't be moved under itself or another selected category. */
  excludeCategoryIds: string[];
  submitting: boolean;
  onClose: () => void;
  onSave: (patch: { parentId?: string | null; needsReview?: boolean }) => Promise<void>;
};

type ParentOption = {
  category: Category;
  depth: number;
};

// "Don't change" needs a value distinct from "" (root) and any real uuid.
const UNCHANGED = "__unchanged__";
const MOVE_TO_ROOT = "__root__";

type ReviewChoice = "unchanged" | "mark-needs-review" | "mark-reviewed";

function flattenParentOptions(parentCategories: Category[]): ParentOption[] {
  const byParent = new Map<string | null, Category[]>();
  parentCategories.forEach((category) => {
    const key = category.parentId ?? null;
    const siblings = byParent.get(key) ?? [];
    siblings.push(category);
    byParent.set(key, siblings);
  });

  byParent.forEach((siblings) => {
    siblings.sort((a, b) => {
      const aName = a.name.en ?? a.name.am ?? a.slug;
      const bName = b.name.en ?? b.name.am ?? b.slug;
      return aName.localeCompare(bName);
    });
  });

  const flattened: ParentOption[] = [];
  const visited = new Set<string>();
  const walk = (parentId: string | null, depth: number) => {
    (byParent.get(parentId) ?? []).forEach((category) => {
      if (visited.has(category.id)) return;
      visited.add(category.id);
      flattened.push({ category, depth });
      walk(category.id, depth + 1);
    });
  };
  walk(null, 0);

  parentCategories.forEach((category) => {
    if (!visited.has(category.id)) {
      flattened.push({ category, depth: 0 });
    }
  });

  return flattened;
}

export default function BulkEditCategoryModal({
  count,
  parentCategories,
  excludeCategoryIds,
  submitting,
  onClose,
  onSave,
}: BulkEditCategoryModalProps) {
  const [parentChoice, setParentChoice] = useState(UNCHANGED);
  const [reviewChoice, setReviewChoice] = useState<ReviewChoice>("unchanged");
  const [error, setError] = useState("");

  const blockedIds = new Set<string>(excludeCategoryIds);
  const collectDescendants = (parentId: string) => {
    parentCategories
      .filter((candidate) => candidate.parentId === parentId)
      .forEach((child) => {
        if (blockedIds.has(child.id)) return;
        blockedIds.add(child.id);
        collectDescendants(child.id);
      });
  };
  excludeCategoryIds.forEach(collectDescendants);

  const availableParents = flattenParentOptions(parentCategories).filter(
    ({ category }) => !blockedIds.has(category.id),
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (parentChoice === UNCHANGED && reviewChoice === "unchanged") {
      setError("Choose at least one change to apply.");
      return;
    }
    setError("");

    const patch: { parentId?: string | null; needsReview?: boolean } = {};
    if (parentChoice === MOVE_TO_ROOT) {
      patch.parentId = null;
    } else if (parentChoice !== UNCHANGED) {
      patch.parentId = parentChoice;
    }
    if (reviewChoice !== "unchanged") {
      patch.needsReview = reviewChoice === "mark-needs-review";
    }

    await onSave(patch);
  }

  return (
    <div className="category-modal-backdrop" onClick={onClose} aria-hidden="true">
      <div
        className="category-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-edit-category-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="category-modal-header">
          <div>
            <div className="ct" id="bulk-edit-category-title">
              Section C · Bulk Update {count} Categor{count === 1 ? "y" : "ies"}
            </div>
            <div className="csub">
              Only fields you change here apply — everything else is left alone
              for every selected category.
            </div>
          </div>
          <button type="button" className="btn ghost sm" onClick={onClose}>
            <i className="ti ti-x" />
          </button>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)}>
          <div className="fg">
            <label className="fl" htmlFor="bulk-category-parent">
              Parent Category
            </label>
            <select
              id="bulk-category-parent"
              value={parentChoice}
              onChange={(event) => setParentChoice(event.target.value)}
            >
              <option value={UNCHANGED}>Don&rsquo;t change</option>
              <option value={MOVE_TO_ROOT}>None — move to top level</option>
              {availableParents.map(({ category, depth }) => (
                <option key={category.id} value={category.id}>
                  {`${depth > 0 ? "-- ".repeat(depth) : ""}${
                    category.name.en ?? category.name.am ?? category.slug
                  }`}
                </option>
              ))}
            </select>
            <div className="fh">
              Applies the same new parent to every selected category.
            </div>
          </div>

          <div className="fg">
            <label className="fl" htmlFor="bulk-category-review">
              Needs Review
            </label>
            <select
              id="bulk-category-review"
              value={reviewChoice}
              onChange={(event) => setReviewChoice(event.target.value as ReviewChoice)}
            >
              <option value="unchanged">Don&rsquo;t change</option>
              <option value="mark-reviewed">Mark as reviewed</option>
              <option value="mark-needs-review">Flag as needs review</option>
            </select>
            <div className="fh">
              &ldquo;Mark as reviewed&rdquo; clears the flag the same way the
              per-row Mark Reviewed action does.
            </div>
          </div>

          {error ? <div className="category-inline-error">{error}</div> : null}

          <div className="category-modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn p" disabled={submitting}>
              <i className="ti ti-device-floppy" />
              {submitting ? "Applying..." : `Apply to ${count} Categor${count === 1 ? "y" : "ies"}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
