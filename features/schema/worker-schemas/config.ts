import type { PageConfig } from "@/features/shared/types";

export const pageConfig = {
  id: "worker-schemas",
  label: "Worker Schemas",
  title: "Worker Schemas",
  icon: "ti-file-code",
  slug: "worker-schemas",
  path: "/schema/worker-schemas",
  apiEndpoint: "/api/schema/worker-schemas",
} satisfies PageConfig;
