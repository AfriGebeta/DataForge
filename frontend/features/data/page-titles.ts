import { pageConfig as DataSourcesConfig } from './data-sources/config';
import { pageConfig as ChannelsConfig } from './channels/config';
import { pageConfig as RawIngestsConfig } from './raw-ingests/config';
import { pageConfig as SchemasConfig } from './schemas/config';
import { pageConfig as CursorsConfig } from './cursors/config';
import { pageConfig as DeadLettersConfig } from './dead-letters/config';

export const pageTitles = {
  'data-sources': DataSourcesConfig.title,
  'channels': ChannelsConfig.title,
  'ingests': RawIngestsConfig.title,
  'schemas': SchemasConfig.title,
  'cursors': CursorsConfig.title,
  'dlq': DeadLettersConfig.title,
} as const;
