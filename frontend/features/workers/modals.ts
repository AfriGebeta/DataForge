import { modalsHtml as worker_typesModals } from './worker-types/modals';

export const modalsHtml = [
  worker_typesModals,
].filter(Boolean).join('\n\n');
