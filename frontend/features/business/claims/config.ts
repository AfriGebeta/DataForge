import type { PageConfig } from "@/features/shared/types";

export const pageConfig = {
  id: "business-claims",
  label: "Business Claims",
  title: "Business Claims",
  icon: "ti-building-store",
  slug: "claims",
  path: "/business/claims",
  apiEndpoint: "/api/v1/claims",
} satisfies PageConfig;
