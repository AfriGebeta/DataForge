import type { PageConfig } from "@/features/shared/types";

export const pageConfig = {
  id: "category-action-modals",
  label: "Action Modals",
  title: "Action Modals (Edit & Delete)",
  icon: "ti-pencil-cog",
  slug: "category-action-modals",
  apiEndpoint: "/api/v1/categories",
} satisfies PageConfig;
