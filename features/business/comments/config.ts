import type { PageConfig } from "@/features/shared/types";

export const pageConfig = {
  id: "business-comments",
  label: "Comments",
  title: "Comments",
  icon: "ti-message-circle",
  slug: "comments",
  path: "/business/comments",
  apiEndpoint: "/api/v1/comments",
} satisfies PageConfig;
