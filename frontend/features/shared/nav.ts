import type { FeatureNavGroup } from "@/features/shared/types";
import { navGroup as overviewNav } from "@/features/overview/nav";
import { navGroup as verificationNav } from "@/features/verification/nav";
import { navGroup as aiAnalysisNav } from "@/features/ai-analysis/nav";
import { navGroup as dataNav } from "@/features/data/nav";
import { navGroup as categoryNav } from "@/features/category/nav";
import { navGroup as workersNav } from "@/features/workers/nav";
import { navGroup as qualityNav } from "@/features/quality/nav";
import { navGroup as systemNav } from "@/features/system/nav";

export type {
  PageConfig as NavItem,
  FeatureNavGroup as NavGroup,
} from "@/features/shared/types";

export const navGroups: FeatureNavGroup[] = [
  overviewNav,
  verificationNav,
  aiAnalysisNav,
  dataNav,
  categoryNav,
  workersNav,
  qualityNav,
  systemNav,
];
