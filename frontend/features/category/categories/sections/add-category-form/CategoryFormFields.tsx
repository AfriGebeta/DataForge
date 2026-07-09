"use client";

import { useState } from "react";
import type {
  Category,
  CategoryFormValues,
  CategoryLanguage,
} from "../../types";

type CategoryFormFieldsProps = {
  values: CategoryFormValues;
  onChange: <K extends keyof CategoryFormValues>(
    field: K,
    value: CategoryFormValues[K],
  ) => void;
  parentCategories: Category[];
  excludeCategoryId?: string;
};

type ParentOption = {
  category: Category;
  depth: number;
};

const NAME_FIELD_BY_LANGUAGE = {
  en: "nameEn",
  am: "nameAm",
} as const satisfies Record<CategoryLanguage, keyof CategoryFormValues>;

const NAME_PLACEHOLDER_BY_LANGUAGE: Record<CategoryLanguage, string> = {
  en: "Restaurants",
  am: "ምግብ ቤቶች",
};

const NAME_LANGUAGE_LABEL: Record<CategoryLanguage, string> = {
  en: "English",
  am: "Amharic",
};

export default function CategoryFormFields({
  values,
  onChange,
  parentCategories,
  excludeCategoryId,
}: CategoryFormFieldsProps) {
  const [nameLanguage, setNameLanguage] = useState<CategoryLanguage>(() =>
    !values.nameEn && values.nameAm ? "am" : "en",
  );

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

  const flattenedParents: ParentOption[] = [];
  const visited = new Set<string>();
  const walk = (parentId: string | null, depth: number) => {
    const children = byParent.get(parentId) ?? [];

    children.forEach((category) => {
      if (visited.has(category.id)) {
        return;
      }

      visited.add(category.id);
      flattenedParents.push({ category, depth });
      walk(category.id, depth + 1);
    });
  };

  walk(null, 0);

  parentCategories.forEach((category) => {
    if (!visited.has(category.id)) {
      flattenedParents.push({ category, depth: 0 });
    }
  });

  const blockedParentIds = new Set<string>();
  const collectDescendants = (parentId: string) => {
    parentCategories
      .filter((candidate) => candidate.parentId === parentId)
      .forEach((child) => {
        if (blockedParentIds.has(child.id)) {
          return;
        }

        blockedParentIds.add(child.id);
        collectDescendants(child.id);
      });
  };

  if (excludeCategoryId) {
    blockedParentIds.add(excludeCategoryId);
    collectDescendants(excludeCategoryId);
  }

  const availableParents = flattenedParents.filter(
    ({ category }) => !blockedParentIds.has(category.id),
  );

  const nameField = NAME_FIELD_BY_LANGUAGE[nameLanguage];

  return (
    <>
      <div className="fg">
        <label className="fl" htmlFor="category-name-language">
          Name Language
        </label>
        <select
          id="category-name-language"
          value={nameLanguage}
          onChange={(event) =>
            setNameLanguage(event.target.value as CategoryLanguage)
          }
        >
          <option value="en">English</option>
          <option value="am">Amharic</option>
        </select>
        <div className="fh">
          Choose which language you&rsquo;re entering the name in.
        </div>
      </div>

      <div className="fg">
        <label className="fl" htmlFor="category-name">
          Name ({NAME_LANGUAGE_LABEL[nameLanguage]}) <span>*</span>
        </label>
        <input
          id="category-name"
          type="text"
          value={values[nameField]}
          onChange={(event) => onChange(nameField, event.target.value)}
          placeholder={NAME_PLACEHOLDER_BY_LANGUAGE[nameLanguage]}
        />
        <div className="fh">At least one language name is required.</div>
      </div>

      <div className="fg">
        <label className="fl" htmlFor="category-slug">
          Slug <span>*</span>
        </label>
        <input
          id="category-slug"
          type="text"
          value={values.slug}
          onChange={(event) => onChange("slug", event.target.value)}
          placeholder="restaurants"
          minLength={2}
          required
        />
        <div className="fh">
          Auto-generated from English name, but still editable.
        </div>
      </div>

      <div className="fg">
        <label className="fl" htmlFor="category-parent">
          Parent Category
        </label>
        <select
          id="category-parent"
          value={values.parentId}
          onChange={(event) => onChange("parentId", event.target.value)}
        >
          <option value="">None — create a top-level category</option>
          {availableParents.map(({ category, depth }) => (
            <option key={category.id} value={category.id}>
              {`${depth > 0 ? `${"-- ".repeat(depth)}` : ""}${
                category.name.en ?? category.name.am ?? category.slug
              }`}
            </option>
          ))}
        </select>
        <div className="fh">
          Any depth is supported. Example: Parent -&gt; Child -&gt; Grandchild.
        </div>
      </div>

      <div className="fg">
        <label className="fl" htmlFor="category-icon">
          Icon Identifier
        </label>
        <input
          id="category-icon"
          type="text"
          value={values.icon}
          onChange={(event) => onChange("icon", event.target.value)}
          placeholder="folder-tree or ti-folder-tree"
        />
        <div className="fh">
          Leave empty to create without an icon. In edit mode, an empty string
          clears the icon.
        </div>
      </div>
    </>
  );
}
