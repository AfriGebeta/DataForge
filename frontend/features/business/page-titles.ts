import { pageConfig as ClaimsConfig } from "./claims/config";

export const pageTitles = {
  [ClaimsConfig.path]: ClaimsConfig.title,
} as const;
