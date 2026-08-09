import { categoryConfig } from './config';
import { pageConfig as DataSourcesConfig } from './data-sources/config';
import { pageConfig as ChannelsConfig } from './channels/config';
import { pageConfig as RawIngestsConfig } from './raw-ingests/config';
import { pageConfig as SchemasConfig } from './schemas/config';
import { pageConfig as CursorsConfig } from './cursors/config';
import { pageConfig as DeadLettersConfig } from './dead-letters/config';
import type { FeatureNavGroup } from '@/features/shared/types';

const items = [
  DataSourcesConfig,
  ChannelsConfig,
  RawIngestsConfig,
  SchemasConfig,
  CursorsConfig,
  DeadLettersConfig,
];

export const navGroup: FeatureNavGroup = {
  ...categoryConfig,
  items,
};
