import { modalsHtml as validation_flagsModals } from './validation-flags/modals';
import { modalsHtml as place_deltasModals } from './place-deltas/modals';
import { modalsHtml as merge_recordsModals } from './merge-records/modals';
import { modalsHtml as completeness_rulesModals } from './completeness-rules/modals';

export const modalsHtml = [
  validation_flagsModals,
  place_deltasModals,
  merge_recordsModals,
  completeness_rulesModals,
].filter(Boolean).join('\n\n');
