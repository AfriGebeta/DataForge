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
  rootCategories: Category[];
  excludeCategoryId?: string;
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
  rootCategories,
  excludeCategoryId,
}: CategoryFormFieldsProps) {
  const [nameLanguage, setNameLanguage] = useState<CategoryLanguage>(() =>
    !values.nameEn && values.nameAm ? "am" : "en",
  );

  const availableParents = rootCategories.filter(
    (category) => category.id !== excludeCategoryId,
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
