import { pageConfig as ClaimsConfig } from "./claims/config";
import { pageConfig as PlaceSourcesConfig } from "./place-sources/config";
import { pageConfig as VibeTagsConfig } from "./vibe-tags/config";
import { pageConfig as RatingsConfig } from "./ratings/config";
import { pageConfig as CommentsConfig } from "./comments/config";

export const pageTitles = {
  [ClaimsConfig.path]: ClaimsConfig.title,
  [PlaceSourcesConfig.path]: PlaceSourcesConfig.title,
  [VibeTagsConfig.path]: VibeTagsConfig.title,
  [RatingsConfig.path]: RatingsConfig.title,
  [CommentsConfig.path]: CommentsConfig.title,
} as const;
