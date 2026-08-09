import { categoryConfig } from "./config";
import { pageConfig as ClaimsConfig } from "./claims/config";
import { pageConfig as PlaceSourcesConfig } from "./place-sources/config";
import { pageConfig as VibeTagsConfig } from "./vibe-tags/config";
import { pageConfig as RatingsConfig } from "./ratings/config";
import { pageConfig as CommentsConfig } from "./comments/config";
import type { FeatureNavGroup } from "@/features/shared/types";

export const navGroup: FeatureNavGroup = {
  ...categoryConfig,
  items: [ClaimsConfig, PlaceSourcesConfig, VibeTagsConfig, RatingsConfig, CommentsConfig],
};
