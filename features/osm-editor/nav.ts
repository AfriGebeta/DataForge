import { historyPageConfig, pageConfig, tasksPageConfig } from "./config";
import type { FeatureNavGroup } from "@/features/shared/types";

export const navGroup: FeatureNavGroup = {
  title: "Map Editor",
  category: "osm-editor",
  items: [pageConfig, tasksPageConfig, historyPageConfig],
};
