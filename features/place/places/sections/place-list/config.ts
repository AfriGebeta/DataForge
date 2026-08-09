import type { PageConfig } from "@/features/shared/types";
export const pageConfig = {
  id: "place-list",
  label: "Place List",
  title: "Place List",
  icon: "ti-list",
  slug: "place-list",
  path: "/place/list",
  apiEndpoint: "/api/v1/places",
} satisfies PageConfig;
