export type WorkerCapability = "TELEGRAM" | "WHATSAPP" | "REST_API" | "BATCH_IMPORT";

export type WorkerType = {
  id: string;
  name: string;
  version: string;
  capabilities: WorkerCapability[];
  max_concurrency: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateWorkerTypeRequest = {
  name: string;
  version: string;
  capabilities: WorkerCapability[];
  max_concurrency: number;
  is_active: boolean;
};

export type WorkerTypesParams = {
  page?: number;
  pageSize?: number;
};

export type WorkerTypesResponse = {
  data: WorkerType[];
  total: number;
  limit: number;
  offset: number;
};
