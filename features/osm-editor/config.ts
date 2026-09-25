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
