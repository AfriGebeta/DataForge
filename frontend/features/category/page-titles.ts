import { pageConfig as CategoryStructureConfig } from "./categories/sections/category-structure/config";
import { pageConfig as NewCategoryConfig } from "./categories/sections/add-category-form/config";
import { pageConfig as CategoryActionModalsConfig } from "./categories/sections/action-modals/config";

export const pageTitles = {
  "category-structure": CategoryStructureConfig.title,
  "new-category": NewCategoryConfig.title,
  "category-action-modals": CategoryActionModalsConfig.title,
} as const;
