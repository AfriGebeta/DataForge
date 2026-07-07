import type { ComponentType } from "react";
import CategoryStructurePage from "./categories/sections/category-structure/CategoryStructurePage";
import NewCategoryPage from "./categories/sections/add-category-form/NewCategoryPage";
import CategoryActionModalsPage from "./categories/sections/action-modals/CategoryActionModalsPage";

export const pages = {
  "category-structure": CategoryStructurePage,
  "new-category": NewCategoryPage,
  "category-action-modals": CategoryActionModalsPage,
} satisfies Record<string, ComponentType>;

export type PageId = keyof typeof pages;
