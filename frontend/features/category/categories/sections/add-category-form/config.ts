import type { PageConfig } from "@/features/shared/types";

export const pageConfig = {
  id: "new-category",
  label: "New Category",
  title: "New Category",
  icon: "ti-folder-plus",
  slug: "new-category",
  apiEndpoint: "/api/v1/categories",
} satisfies PageConfig;
