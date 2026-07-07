"use client";

import type { Category, CategoryFormValues } from "../../types";

type CategoryFormFieldsProps = {
  values: CategoryFormValues;
  onChange: <K extends keyof CategoryFormValues>(
    field: K,
    value: CategoryFormValues[K],
  ) => void;
  rootCategories: Category[];
  excludeCategoryId?: string;
};

export default function CategoryFormFields({
  values,
  onChange,
  rootCategories,
  excludeCategoryId,
}: CategoryFormFieldsProps) {
  const availableParents = rootCategories.filter(
    (category) => category.id !== excludeCategoryId,
  );

  return (
    <>
      <div className="fg">
        <label className="fl" htmlFor="category-name-en">
          Name (English) <span>*</span>
        </label>
        <input
          id="category-name-en"
          type="text"
          value={values.nameEn}
          onChange={(event) => onChange("nameEn", event.target.value)}
          placeholder="Restaurants"
          required
        />
      </div>

      <div className="fg">
        <label className="fl" htmlFor="category-name-am">
          Name (Amharic) <span>*</span>
        </label>
        <input
          id="category-name-am"
          type="text"
          value={values.nameAm}
          onChange={(event) => onChange("nameAm", event.target.value)}
          placeholder="ምግብ ቤቶች"
          required
        />
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
          {availableParents.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name.en ?? category.name.am ?? category.slug}
            </option>
          ))}
        </select>
        <div className="fh">
          Only root categories can be selected as parents.
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
