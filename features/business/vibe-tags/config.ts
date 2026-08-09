import type { PageConfig } from "@/features/shared/types";

export const pageConfig = {
  id: "business-vibe-tags",
  label: "Vibe Tags",
  title: "Vibe Tags",
  icon: "ti-tags",
  slug: "vibe-tags",
  path: "/business/vibe-tags",
  apiEndpoint: "/api/v1/vibes",
} satisfies PageConfig;
