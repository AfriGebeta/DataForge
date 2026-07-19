import type {
  ChannelsParams,
  ChannelsResponse,
  ChannelConfig,
  CreateChannelConfigRequest,
} from "./types";

/** API endpoint for creating channels: http://localhost:8080/channels/ */
export const API_ENDPOINT = "http://localhost:8080/channels/" as const;

/** API endpoint for fetching channels: http://localhost:8080/channels */
export const FETCH_CHANNELS_ENDPOINT =
  "http://localhost:8080/channels" as const;

/** Fake data for channels (matches ChannelConfig type) */
const fakeChannels: ChannelConfig[] = [
  {
    id: "123e4567-e89b-12d3-a456-426614174000",
    channel_id: "telegram_news_feed",
    channel_name: "Telegram News Feed",
    channel: "TELEGRAM",
    default_message_type: "TEXT",
    default_language: "en",
    default_source_type: "WEBHOOK",
    price_bracket: "FREE",
    is_active: true,
    expected_frequency_hours: 24,
    last_message_at: "2023-10-01T12:00:00Z",
    webhook_url: "https://example.com/webhook",
    schedule_type: "INTERVAL",
    poll_interval_sec: 3600,
    timezone: "UTC",
    next_run_at: "2023-10-02T12:00:00Z",
    last_run_at: "2023-10-01T12:00:00Z",
    last_run_status: "SUCCESS",
    last_processed_message_id: "msg_123",
    last_processed_at: "2023-10-01T12:00:00Z",
    expected_schema_id: "schema_123",
    created_at: "2023-09-01T12:00:00Z",
    updated_at: "2023-09-01T12:00:00Z",
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174001",
    channel_id: "rest_api_import",
    channel_name: "REST API Import",
    channel: "REST_API",
    default_message_type: "POI",
    default_language: "en",
    default_source_type: "PARTNER_IMPORT",
    price_bracket: "PAID",
    is_active: true,
    expected_frequency_hours: 12,
    last_message_at: "2023-10-01T10:00:00Z",
    webhook_url: "https://example.com/api/import",
    schedule_type: "CRON",
    cron_expr: "0 * * * *",
    timezone: "UTC",
    next_run_at: "2023-10-02T10:00:00Z",
    last_run_at: "2023-10-01T10:00:00Z",
    last_run_status: "SUCCESS",
    last_processed_message_id: "msg_456",
    last_processed_at: "2023-10-01T10:00:00Z",
    expected_schema_id: "schema_456",
    created_at: "2023-08-01T12:00:00Z",
    updated_at: "2023-08-01T12:00:00Z",
  },
];

/** Simulate fetching channels with fake data */
export async function fetchChannels(
  params?: ChannelsParams,
): Promise<ChannelsResponse> {
  console.log("Using fake data for channels (no backend)"); // Debug log

  // Simulate pagination
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 10;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = fakeChannels.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    total: fakeChannels.length,
    limit: pageSize,
    offset: startIndex,
  };
}

/** Create a new channel config (fake implementation) */
export async function createChannelConfig(
  request: CreateChannelConfigRequest,
): Promise<ChannelConfig> {
  console.log("Using fake implementation for createChannelConfig (no backend)"); // Debug log

  // Simulate creating a new channel
  const newChannel: ChannelConfig = {
    id: "123e4567-e89b-12d3-a456-426614174002",
    channel_id: request.channel_id,
    channel_name: request.channel_name || null,
    channel: request.channel,
    default_message_type: request.default_message_type || null,
    default_language: request.default_language || "en",
    default_source_type: request.default_source_type,
    price_bracket: request.price_bracket || null,
    is_active: request.is_active || false,
    expected_frequency_hours: request.expected_frequency_hours || null,
    last_message_at: null,
    webhook_url: request.webhook_url || null,
    schedule_type: request.schedule_type,
    cron_expr: request.cron_expr || null,
    poll_interval_sec: request.poll_interval_sec || null,
    timezone: request.timezone,
    next_run_at: null,
    last_run_at: null,
    last_run_status: null,
    last_processed_message_id: null,
    last_processed_at: null,
    expected_schema_id: request.expected_schema_id || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  fakeChannels.push(newChannel);
  return newChannel;
}
