import type { PageConfig } from "@/features/shared/types";
export const pageConfig = {
  id: "place-add",
  label: "Add Place",
  title: "Add Place",
  icon: "ti-map-pin-plus",
  slug: "place-add",
  path: "/place/add",
  apiEndpoint: "/api/v1/places",
} satisfies PageConfig;
