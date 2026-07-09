import { categoryConfig } from "./config";
import { pageConfig as CategoryStructureConfig } from "./categories/sections/category-structure/config";
import { pageConfig as NewCategoryConfig } from "./categories/sections/add-category-form/config";
import type { FeatureNavGroup } from "@/features/shared/types";

const items = [
  CategoryStructureConfig,
  NewCategoryConfig,
];

export const navGroup: FeatureNavGroup = {
  ...categoryConfig,
  items,
};
