import type { ComponentType } from "react";
import ClaimsPage from "./claims";
import PlaceSourcesPage from "./place-sources";
import VibeTagsPage from "./vibe-tags";
import RatingsPage from "./ratings";
import CommentsPage from "./comments";

export const pages = {
  "business-claims": ClaimsPage,
  "business-place-sources": PlaceSourcesPage,
  "business-vibe-tags": VibeTagsPage,
  "business-ratings": RatingsPage,
  "business-comments": CommentsPage,
} satisfies Record<string, ComponentType>;
