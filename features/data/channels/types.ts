/** Domain types for channels — mirrors PlaceForge's ingest module ChannelConfig. */

export type IngestChannelType =
  | "TELEGRAM_BOT"
  | "TELEGRAM_WEBHOOK"
  | "WHATSAPP_WEBHOOK"
  | "REST_API"
  | "BATCH_IMPORT"
  | "MANUAL";

export type IngestMessageType =
  | "POI"
  | "REAL_ESTATE"
  | "ROAD"
  | "TRANSIT"
  | "ADMIN_BOUNDARY"
  | "NATURAL"
  | "UNKNOWN";

export type ExternalSourceType =
  | "OSM"
  | "WIKIDATA"
  | "WIKIPEDIA"
  | "GEONAMES"
  | "GOVERNMENT"
  | "MUNICIPALITY"
  | "USER_SUBMISSION"
  | "PARTNER_IMPORT"
  | "MANUAL_ENTRY"
  | "THIRD_PARTY"
  | "UNKNOWN";

export type ScheduleType = "MANUAL" | "CRON" | "INTERVAL" | "WEBHOOK" | "LONG_POLL";

/** Channel configuration returned by GET /api/v1/channels */
export type ChannelConfig = {
  id: string;
  channel_id: string;
  channel_name?: string | null;
  channel: IngestChannelType;
  default_message_type?: IngestMessageType | null;
  default_language?: string | null;
  default_source_type: ExternalSourceType;
  price_bracket?: string | null;
  is_active: boolean;
  expected_frequency_hours?: number | null;
  last_message_at?: string | null;
  webhook_url?: string | null;
  schedule_type: ScheduleType;
  cron_expr?: string | null;
  poll_interval_sec?: number | null;
  timezone: string;
  next_run_at?: string | null;
  last_run_at?: string | null;
  last_run_status?: string | null;
  last_processed_message_id?: string | null;
  last_processed_at?: string | null;
  expected_schema_id?: string | null;
  created_at: string;
  updated_at: string;
};

/** Request body for POST /api/v1/channels */
export type CreateChannelConfigRequest = {
  channel_id: string;
  channel_name?: string | null;
  channel: IngestChannelType;
  default_message_type?: IngestMessageType | null;
  default_language?: string | null;
  default_source_type: ExternalSourceType;
  price_bracket?: string | null;
  is_active?: boolean;
  is_trusted?: boolean;
  expected_frequency_hours?: number | null;
  bot_token_ref?: string | null;
  token?: string | null;
  webhook_url?: string | null;
  webhook_secret?: string | null;
  schedule_type: ScheduleType;
  cron_expr?: string | null;
  poll_interval_sec?: number | null;
  timezone: string;
  expected_schema_id?: string | null;
};

/** Request body for PATCH /api/v1/channels/{id} — channel_id/channel/bot_token_ref are immutable. */
export type UpdateChannelConfigRequest = Partial<
  Omit<CreateChannelConfigRequest, "channel_id" | "channel" | "bot_token_ref">
>;

/** Response wrapper for GET /api/v1/channels */
export type ChannelsResponse = {
  data: ChannelConfig[];
  total: number;
  limit: number;
  offset: number;
};

export type ChannelsParams = {
  limit?: number;
  offset?: number;
  activeOnly?: boolean;
};
