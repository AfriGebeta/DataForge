/** Domain types for channels — align with backend contracts. */

export type ChannelType = "TELEGRAM" | "REST_API" | "BATCH_IMPORT" | "MANUAL";
export type MessageType =
  "TEXT" | "POI" | "ROAD" | "TRANSIT" | "NATURAL" | "UNKNOWN";
export type SourceType =
  "WEBHOOK" | "USER_SUBMISSION" | "PARTNER_IMPORT" | "MANUAL_ENTRY";
export type ScheduleType = "INTERVAL" | "CRON" | "WEBHOOK" | "MANUAL";
export type RunStatus = "SUCCESS" | "FAILED" | "PENDING";

/** Channel configuration returned by GET /channels */
export type ChannelConfig = {
  id: string;
  channel_id: string;
  channel_name?: string | null;
  channel: ChannelType;
  default_message_type?: MessageType | null;
  default_language?: string | null;
  default_source_type: SourceType;
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
  last_run_status?: RunStatus | null;
  last_processed_message_id?: string | null;
  last_processed_at?: string | null;
  expected_schema_id?: string | null;
  created_at: string;
  updated_at: string;
};

/** Request body for POST /channels */
export type CreateChannelConfigRequest = {
  channel_id: string;
  channel_name?: string | null;
  channel: ChannelType;
  default_message_type?: MessageType | null;
  default_language?: string | null;
  default_source_type: SourceType;
  price_bracket?: string | null;
  is_active?: boolean;
  expected_frequency_hours?: number | null;
  bot_token_ref?: string | null;
  webhook_url?: string | null;
  webhook_secret?: string | null;
  schedule_type: ScheduleType;
  cron_expr?: string | null;
  poll_interval_sec?: number | null;
  timezone: string;
  expected_schema_id?: string | null;
};

/** Response wrapper for GET /channels */
export type ChannelsResponse = {
  data: ChannelConfig[];
  total: number;
  limit: number;
  offset: number;
};

export type ChannelsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};
