import type { PageConfig } from "@/features/shared/types";

export const pageConfig = {
  id: "business-ratings",
  label: "Ratings",
  title: "Ratings",
  icon: "ti-star",
  slug: "ratings",
  path: "/business/ratings",
  apiEndpoint: "/api/v1/ratings",
} satisfies PageConfig;
