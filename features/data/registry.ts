import type { ComponentType } from 'react';
import DataSourcesPage from './data-sources';
import ChannelsPage from './channels';
import RawIngestsPage from './raw-ingests';
import SchemasPage from './schemas';
import CursorsPage from './cursors';
import DeadLettersPage from './dead-letters';

export const pages = {
  'data-sources': DataSourcesPage,
  'channels': ChannelsPage,
  'ingests': RawIngestsPage,
  'schemas': SchemasPage,
  'cursors': CursorsPage,
  'dlq': DeadLettersPage,
} satisfies Record<string, ComponentType>;

export type PageId = keyof typeof pages;
