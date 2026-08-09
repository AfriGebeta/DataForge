import { pageConfig as WorkerSchemasConfig } from "./worker-schemas/config";

export const pageTitles = {
  [WorkerSchemasConfig.path]: WorkerSchemasConfig.title,
} as const;
