import type { ComponentType } from "react";
import ClaimsPage from "./claims";

export const pages = {
  "business-claims": ClaimsPage,
} satisfies Record<string, ComponentType>;
