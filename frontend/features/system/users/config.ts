import type { PageConfig } from "@/features/shared/types";

export const pageConfig = {
  id: "users",
  label: "Users",
  title: "Users",
  icon: "ti-users",
  slug: "users",
  path: "/system/users",
  apiEndpoint: "/api/system/users",
} satisfies PageConfig;
