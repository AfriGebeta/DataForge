import { pageConfig as CategoryStructureConfig } from "./categories/sections/category-structure/config";
import { pageConfig as NewCategoryConfig } from "./categories/sections/add-category-form/config";

export const pageTitles = {
  "category-structure": CategoryStructureConfig.title,
  "new-category": NewCategoryConfig.title,
} as const;
