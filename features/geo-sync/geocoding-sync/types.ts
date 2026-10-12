/**
 * Domain types for the Geocoding Sync admin page — mirrors PlaceForge's
 * geosync module (`src/modules/geosync/api/v1/model.go`) exactly.
 * See /FORGE_TO_GOSCHEMA_SYNC.md for the full design this page configures.
 */

export type RegistryToken = {
  name: string;
};

export type RegistryGroup = {
  name: string;
  tokens: RegistryToken[];
};

export type FieldConfig = {
  template: string;
  default_template: string;
  required_columns: string[];
  registry: RegistryGroup[];
  updated_by?: string;
  updated_at?: string;
};

export type PreviewResult = {
  rendered?: Record<string, unknown>;
  valid: boolean;
  place_id?: number;
  used_fixture: boolean;
};

export type ReplaceAllJobStatus = "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

export type ReplaceAllJob = {
  id: string;
  status: ReplaceAllJobStatus;
  total_places: number;
  processed_places: number;
  upserted_places: number;
  failed_places: number;
  error_message?: string;
  started_at: string;
  finished_at?: string;
  updated_at: string;
};
