import type { PageConfig } from "@/features/shared/types";

export const pageConfig = {
  id: "category-structure",
  label: "Category Structure",
  title: "Category Structure Table/Tree",
  icon: "ti-list-tree",
  slug: "category-structure",
  apiEndpoint: "/api/v1/categories",
} satisfies PageConfig;
