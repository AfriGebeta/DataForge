import { pageConfig as CategoryStructureConfig } from "./categories/sections/category-structure/config";
import { pageConfig as NewCategoryConfig } from "./categories/sections/add-category-form/config";

export const pageTitles = {
  [CategoryStructureConfig.path]: CategoryStructureConfig.title,
  [NewCategoryConfig.path]: NewCategoryConfig.title,
} as const;
