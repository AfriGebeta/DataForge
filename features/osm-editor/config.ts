import type { PageConfig } from "@/features/shared/types";

export const pageConfig = {
  id: "osm-editor",
  label: "Map Editor",
  title: "OSM Map Editor",
  icon: "ti-map-2",
  slug: "osm-editor",
  path: "/osm-editor",
  apiEndpoint: "/api/v1/osm",
} satisfies PageConfig;

export const historyPageConfig = {
  id: "osm-history",
  label: "Edit History",
  title: "OSM Edit History",
  icon: "ti-history",
  slug: "osm-editor/history",
  path: "/osm-editor/history",
  apiEndpoint: "/api/v1/osm/changesets",
} satisfies PageConfig;

export const tasksPageConfig = {
  id: "osm-tasks",
  label: "Edit Tasks",
  title: "Edit Tasks",
  icon: "ti-checklist",
  slug: "osm-editor/tasks",
  path: "/osm-editor/tasks",
  apiEndpoint: "/api/v1/edit-tasks",
} satisfies PageConfig;
