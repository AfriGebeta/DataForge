import { categoryConfig } from './config';
import { pageConfig as WorkerTypesConfig } from './worker-types/config';
import { pageConfig as InstancesConfig } from './instances/config';
import { pageConfig as RunsConfig } from './runs/config';
import type { FeatureNavGroup } from '@/features/shared/types';

const items = [
  WorkerTypesConfig,
  InstancesConfig,
  RunsConfig,
];

export const navGroup: FeatureNavGroup = {
  ...categoryConfig,
  items,
};
