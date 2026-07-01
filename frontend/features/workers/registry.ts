import type { ComponentType } from 'react';
import WorkerTypesPage from './worker-types';
import InstancesPage from './instances';
import RunsPage from './runs';

export const pages = {
  'workers': WorkerTypesPage,
  'instances': InstancesPage,
  'runs': RunsPage,
} satisfies Record<string, ComponentType>;

export type PageId = keyof typeof pages;
