/** Mirrors PlaceForge's worker module WorkerRegistry (GET/POST /api/v1/workers). */

export type WorkerCapability =
  | "TELEGRAM"
  | "WHATSAPP"
  | "WEBSITE"
  | "REST_API"
  | "BATCH_IMPORT"
  | "MANUAL";

export type WorkerType = {
  id: string;
  name: string;
  version?: string | null;
  capabilities: WorkerCapability[];
  max_concurrency?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/** Body for POST /api/v1/workers — also how a deactivated worker is reactivated (upsert-by-name). */
export type CreateWorkerTypeRequest = {
  name: string;
  version?: string | null;
  capabilities: WorkerCapability[];
  max_concurrency?: number | null;
  is_active: boolean;
};
