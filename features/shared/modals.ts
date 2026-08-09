import { modalsHtml as overviewModals } from "@/features/overview/modals";
import { modalsHtml as verificationModals } from "@/features/verification/modals";
import { modalsHtml as aiAnalysisModals } from "@/features/ai-analysis/modals";
import { modalsHtml as dataModals } from "@/features/data/modals";
import { modalsHtml as workersModals } from "@/features/workers/modals";
import { modalsHtml as qualityModals } from "@/features/quality/modals";
import { modalsHtml as systemModals } from "@/features/system/modals";
import { modalsHtml as categoryModals } from "@/features/category/modals";
import { modalsHtml as placeModals } from "@/features/place/modals";

export const modalsHtml = [
  overviewModals,
  verificationModals,
  aiAnalysisModals,
  dataModals,
  workersModals,
  qualityModals,
  systemModals,
  categoryModals,
  placeModals,
]
  .filter(Boolean)
  .join("\n\n");
