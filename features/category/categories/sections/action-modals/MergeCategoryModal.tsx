"use client";

import { useState } from "react";
import type { Category } from "../../types";

type MergeCategoryModalProps = {
  /** The duplicate category being folded away and deleted. */
  source: Category;
  /** Every category to offer as a merge target, flat (any depth). */
  categories: Category[];
  /** Pre-selects the target dropdown — used for the "2 selected → merge" flow. */
  defaultTargetId?: string;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (targetId: string) => Promise<void>;
};

type TargetOption = {
  category: Category;
  depth: number;
};

function localizedName(category: Category): string {
  return category.name.en ?? category.name.am ?? category.slug;
}

function flattenTargetOptions(categories: Category[]): TargetOption[] {
  const byParent = new Map<string | null, Category[]>();
  categories.forEach((category) => {
    const key = category.parentId ?? null;
    const siblings = byParent.get(key) ?? [];
    siblings.push(category);
    byParent.set(key, siblings);
  });

  byParent.forEach((siblings) => {
    siblings.sort((a, b) => localizedName(a).localeCompare(localizedName(b)));
  });

  const flattened: TargetOption[] = [];
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

  categories.forEach((category) => {
    if (!visited.has(category.id)) {
      flattened.push({ category, depth: 0 });
    }
  });

  return flattened;
}

export default function MergeCategoryModal({
  source,
  categories,
  defaultTargetId,
  submitting,
  onClose,
  onConfirm,
}: MergeCategoryModalProps) {
  const [targetId, setTargetId] = useState(defaultTargetId ?? "");
  const [error, setError] = useState("");

  // A merge deletes `source` and reparents its children onto the target —
  // picking a descendant of source as the target would loop the hierarchy
  // back through the category being deleted, same cycle the backend also
  // rejects. Excluded here purely so the dropdown can't offer it.
  const blockedIds = new Set<string>([source.id]);
  const collectDescendants = (parentId: string) => {
    categories
      .filter((candidate) => candidate.parentId === parentId)
      .forEach((child) => {
        if (blockedIds.has(child.id)) return;
        blockedIds.add(child.id);
        collectDescendants(child.id);
      });
  };
  collectDescendants(source.id);

  const targetOptions = flattenTargetOptions(categories).filter(
    ({ category }) => !blockedIds.has(category.id),
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!targetId) {
      setError("Choose which category should survive the merge.");
      return;
    }
    setError("");

    await onConfirm(targetId);
  }

  return (
    <div className="category-modal-backdrop" onClick={onClose} aria-hidden="true">
      <div
        className="category-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="merge-category-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="category-modal-header">
          <div>
            <div className="ct" id="merge-category-title">
              Merge Duplicate Category
            </div>
            <div className="csub">
              Combine <strong>{localizedName(source)}</strong> into another
              category — its places and sub-categories move over, then it&rsquo;s
              deleted.
            </div>
          </div>
          <button type="button" className="btn ghost sm" onClick={onClose}>
            <i className="ti ti-x" />
          </button>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)}>
          <div className="fg">
            <label className="fl">Category being merged away (deleted)</label>
            <div className="mono">
              {localizedName(source)} <span className="csub">/{source.slug}</span>
            </div>
          </div>

          <div className="fg">
            <label className="fl" htmlFor="merge-category-target">
              Merge into (survives)
            </label>
            <select
              id="merge-category-target"
              value={targetId}
              onChange={(event) => setTargetId(event.target.value)}
            >
              <option value="">Select a category…</option>
              {targetOptions.map(({ category, depth }) => (
                <option key={category.id} value={category.id}>
                  {`${depth > 0 ? "-- ".repeat(depth) : ""}${localizedName(category)}`}
                </option>
              ))}
            </select>
            <div className="fh">
              Every place and child category currently under &ldquo;
              {localizedName(source)}&rdquo; is reassigned here, then &ldquo;
              {localizedName(source)}&rdquo; is permanently deleted.
            </div>
          </div>

          {error ? <div className="category-inline-error">{error}</div> : null}

          <div className="category-modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn d" disabled={submitting}>
              <i className="ti ti-git-merge" />
              {submitting ? "Merging..." : "Merge Categories"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
