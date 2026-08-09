export type WorkerSchema = {
  id: string;
  name: string;
  version: number;
  jsonSchema: Record<string, unknown>;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateWorkerSchemaRequest = {
  name: string;
  jsonSchema: Record<string, unknown>;
  description: string;
  isActive: boolean;
};

export type UpdateWorkerSchemaRequest = {
  jsonSchema: Record<string, unknown>;
  description: string;
  isActive: boolean;
};

export type WorkerSchemasParams = {
  page?: number;
  pageSize?: number;
};

export type WorkerSchemasResponse = {
  data: WorkerSchema[];
  total: number;
  limit: number;
  offset: number;
};
