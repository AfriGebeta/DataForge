import { categoryConfig } from "./config";
import { pageConfig as WorkerSchemasConfig } from "./worker-schemas/config";
import type { FeatureNavGroup } from "@/features/shared/types";

export const navGroup: FeatureNavGroup = {
  ...categoryConfig,
  items: [WorkerSchemasConfig],
};
