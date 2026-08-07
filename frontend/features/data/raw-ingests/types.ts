export type RawIngestsParams = {
  page?: number;
  limit?: number;
  status?: string;
  channel?: string;
  workerId?: string;
};


export type RawIngestItem = {
  id: string;
  channel: string;
  channel_id?: string;
  message_id?: string;
  source_type: string;
  message_type?: string;
  status: string;
  retry_count: number;
  language?: string;
  error_log?: string;
  resolved_latitude?: number;
  resolved_longitude?: number;
  resolved_confidence?: number;
  resolved_method?: string;
  parsed_place_id?: number;
  sent_at?: string;
  received_at: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
};

export type RawIngestsResponse = {
  items: RawIngestItem[];
  total: number;
};
