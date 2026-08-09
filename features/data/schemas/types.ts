/** Domain types for worker schemas — mirrors PlaceForge's ingest module WorkerSchema. */

export type WorkerSchema = {
  id: string;
  name: string;
  version: number;
  json_schema: unknown;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateWorkerSchemaRequest = {
  name: string;
  version: number;
  json_schema: unknown;
  description?: string | null;
  is_active: boolean;
};

export type UpdateWorkerSchemaRequest = {
  json_schema?: unknown;
  description?: string | null;
  is_active?: boolean;
};

export type SchemasParams = {
  activeOnly?: boolean;
};
