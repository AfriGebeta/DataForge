/** Domain types for raw ingests — mirrors PlaceForge's ingest module RawIngest. */

import type { ExternalSourceType, IngestChannelType, IngestMessageType } from "../channels/types";

export type { ExternalSourceType, IngestChannelType, IngestMessageType };

export type IngestStatus =
  | "PENDING"
  | "QUEUED"
  | "CLASSIFYING"
  | "PARSING"
  | "ENRICHING"
  | "GEO_RESOLVING"
  | "CONFLATING"
  | "SCORING"
  | "DONE"
  | "FAILED"
  | "DUPLICATE"
  | "SKIPPED";

/** Response shape for GET /api/v1/ingests and /ingests/{id} */
export type RawIngest = {
  id: string;
  channel: IngestChannelType;
  channel_id?: string;
  message_id?: string | null;
  source_type: ExternalSourceType;
  message_type?: IngestMessageType | null;
  status: IngestStatus;
  retry_count: number;
  language?: string | null;
  error_log?: string | null;
  resolved_latitude?: number | null;
  resolved_longitude?: number | null;
  resolved_confidence?: number | null;
  resolved_method?: string | null;
  parsed_place_id?: number | null;
  sent_at?: string | null;
  received_at: string;
  processed_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type RawIngestsResponse = {
  data: RawIngest[];
  total: number;
  limit: number;
  offset: number;
};

export type RawIngestsParams = {
  status?: IngestStatus;
  channel?: IngestChannelType;
  limit?: number;
  offset?: number;
};

export type IngestStatsResponse = {
  channel?: IngestChannelType;
  counts: Record<string, number>;
};

/** Request body for POST /api/v1/ingests */
export type SubmitIngestRequest = {
  channel: IngestChannelType;
  channel_id?: string;
  message_id?: string | null;
  source_type: ExternalSourceType;
  raw_text: string;
  extracted_data: Record<string, unknown>;
  language?: string | null;
  message_type?: IngestMessageType | null;
  sent_at?: string | null;
};
