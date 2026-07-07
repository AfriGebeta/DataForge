import { pageTitles as overviewTitles } from "@/features/overview/page-titles";
import { pageTitles as verificationTitles } from "@/features/verification/page-titles";
import { pageTitles as aiAnalysisTitles } from "@/features/ai-analysis/page-titles";
import { pageTitles as dataTitles } from "@/features/data/page-titles";
import { pageTitles as workersTitles } from "@/features/workers/page-titles";
import { pageTitles as qualityTitles } from "@/features/quality/page-titles";
import { pageTitles as systemTitles } from "@/features/system/page-titles";
import { pageTitles as categoryTitles } from "@/features/category/page-titles";

export const pageTitles: Record<string, string> = {
  ...overviewTitles,
  ...verificationTitles,
  ...aiAnalysisTitles,
  ...dataTitles,
  ...workersTitles,
  ...qualityTitles,
  ...systemTitles,
  ...categoryTitles,
};
