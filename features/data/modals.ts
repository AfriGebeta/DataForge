import { modalsHtml as channelsModals } from './channels/modals';
import { modalsHtml as raw_ingestsModals } from './raw-ingests/modals';
import { modalsHtml as schemasModals } from './schemas/modals';

export const modalsHtml = [
  channelsModals,
  raw_ingestsModals,
  schemasModals,
].filter(Boolean).join('\n\n');
