import { categoryConfig } from "./config";
import { pageConfig as CategoryStructureConfig } from "./categories/sections/category-structure/config";
import { pageConfig as NewCategoryConfig } from "./categories/sections/add-category-form/config";
import { pageConfig as CategoryActionModalsConfig } from "./categories/sections/action-modals/config";
import type { FeatureNavGroup } from "@/features/shared/types";

const items = [
  CategoryStructureConfig,
  NewCategoryConfig,
  CategoryActionModalsConfig,
];

export const navGroup: FeatureNavGroup = {
  ...categoryConfig,
  items,
};
