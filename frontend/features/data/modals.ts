import { modalsHtml as channelsModals } from './channels/modals';
import { modalsHtml as raw_ingestsModals } from './raw-ingests/modals';

export const modalsHtml = [
  channelsModals,
  raw_ingestsModals,
].filter(Boolean).join('\n\n');
