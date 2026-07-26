import { categoryConfig } from "./config";
import { pageConfig as ClaimsConfig } from "./claims/config";
import type { FeatureNavGroup } from "@/features/shared/types";

export const navGroup: FeatureNavGroup = {
  ...categoryConfig,
  items: [ClaimsConfig],
};
