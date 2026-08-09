import type { PageConfig } from "@/features/shared/types";
export const pageConfig = {
  id: "place-delete",
  label: "Deactivate Place",
  title: "Deactivate Place",
  icon: "ti-eye-off",
  slug: "place-delete",
  path: "/place/delete",
  apiEndpoint: "/api/v1/places",
} satisfies PageConfig;
