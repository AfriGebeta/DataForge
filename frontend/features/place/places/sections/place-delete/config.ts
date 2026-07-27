import type { PageConfig } from "@/features/shared/types";
export const pageConfig = {
  id: "place-delete",
  label: "Delete Place",
  title: "Delete Place",
  icon: "ti-trash",
  slug: "place-delete",
  path: "/place/delete",
  apiEndpoint: "/api/v1/places",
} satisfies PageConfig;
