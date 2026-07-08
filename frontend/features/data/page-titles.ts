import { pageConfig as DataSourcesConfig } from './data-sources/config';
import { pageConfig as ChannelsConfig } from './channels/config';
import { pageConfig as RawIngestsConfig } from './raw-ingests/config';
import { pageConfig as SchemasConfig } from './schemas/config';
import { pageConfig as CursorsConfig } from './cursors/config';
import { pageConfig as DeadLettersConfig } from './dead-letters/config';
export const pageTitles = {
  [DataSourcesConfig.path]: DataSourcesConfig.title,
  [ChannelsConfig.path]: ChannelsConfig.title,
  [RawIngestsConfig.path]: RawIngestsConfig.title,
  [SchemasConfig.path]: SchemasConfig.title,
  [CursorsConfig.path]: CursorsConfig.title,
  [DeadLettersConfig.path]: DeadLettersConfig.title,
} as const;
