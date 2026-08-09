import type { PageConfig } from "@/features/shared/types";
export const pageConfig = {
  id: "place-update",
  label: "Update Place",
  title: "Update Place",
  icon: "ti-edit",
  slug: "place-update",
  path: "/place/update",
  apiEndpoint: "/api/v1/places",
} satisfies PageConfig;
