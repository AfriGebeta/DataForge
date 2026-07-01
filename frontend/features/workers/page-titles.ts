import { pageConfig as WorkerTypesConfig } from './worker-types/config';
import { pageConfig as InstancesConfig } from './instances/config';
import { pageConfig as RunsConfig } from './runs/config';

export const pageTitles = {
  'workers': WorkerTypesConfig.title,
  'instances': InstancesConfig.title,
  'runs': RunsConfig.title,
} as const;
