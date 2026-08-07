export type IngestCursor = {
  id: string;
  channel_config_id: string;
  worker_instance_id?: string;
  cursor_key: string;
  cursor_value: string;
  captured_at: string;
};

export type CursorsParams = {
  channel_config_id?: string;
  page?: number;
  limit?: number;
};

export type CursorsResponse = {
  items: IngestCursor[];
  total: number;
};
