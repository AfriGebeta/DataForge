/** Domain types for cursors — mirrors PlaceForge's ingest module IngestCursor. */

export type IngestCursor = {
  id: string;
  channel_config_id: string;
  worker_instance_id?: string | null;
  cursor_key: string;
  cursor_value: string;
  captured_at: string;
};

export type UpsertCursorRequest = {
  cursor_key: string;
  cursor_value: string;
  worker_instance_id?: string | null;
};
