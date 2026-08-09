import { pageConfig as WorkerTypesConfig } from './worker-types/config';
import { pageConfig as InstancesConfig } from './instances/config';
import { pageConfig as RunsConfig } from './runs/config';
export const pageTitles = {
  [WorkerTypesConfig.path]: WorkerTypesConfig.title,
  [InstancesConfig.path]: InstancesConfig.title,
  [RunsConfig.path]: RunsConfig.title,
} as const;
