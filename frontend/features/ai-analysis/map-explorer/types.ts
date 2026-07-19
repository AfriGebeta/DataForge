export type MapOverlay = {
  id: string;
  label: string;
  dot_class: string;
  enabled: boolean;
};

export type MapCluster = {
  id: string;
  lat: string;
  lng: string;
  trust_score: number;
};

export type RegionStats = {
  total_points: number;
  duplicate_density: number;
};

export type MapExplorerData = {
  overlays: MapOverlay[];
  trust_score_range: number;
  data_source: string;
  active_cluster: MapCluster;
  region_stats: RegionStats;
};