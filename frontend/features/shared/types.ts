import type { ComponentType } from "react";

export type PageConfig = {
  id: string;
  label: string;
  title: string;
  icon: string;
  slug: string;
  path: string;
  apiEndpoint: string;
};

export type FeatureNavGroup = {
  title: string;
  category: string;
  defaultOpen?: boolean;
  items: PageConfig[];
};

export type FeatureRegistry = Record<string, ComponentType>;
export type FeaturePageTitles = Record<string, string>;