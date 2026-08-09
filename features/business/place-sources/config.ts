import type { PageConfig } from "@/features/shared/types";

export const pageConfig = {
  id: "business-place-sources",
  label: "Place Sources",
  title: "Place Sources",
  icon: "ti-plug-connected",
  slug: "place-sources",
  path: "/business/place-sources",
  apiEndpoint: "/api/v1/place-sources",
} satisfies PageConfig;
