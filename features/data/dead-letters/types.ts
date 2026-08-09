/** Domain types for dead letters — mirrors PlaceForge's ingest module DeadLetterMessage. */

export type DeadLetter = {
  id: string;
  source_queue: string;
  worker_instance_id?: string | null;
  raw_ingest_id?: string | null;
  error_message: string;
  retry_count: number;
  is_replayed: boolean;
  replayed_at?: string | null;
  replay_result?: string | null;
  failed_at: string;
  created_at: string;
};

export type DeadLettersResponse = {
  data: DeadLetter[];
  total: number;
  limit: number;
  offset: number;
};

export type DeadLettersParams = {
  queue?: string;
  replayed?: boolean;
  limit?: number;
  offset?: number;
};
