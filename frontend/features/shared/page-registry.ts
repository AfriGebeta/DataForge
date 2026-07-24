import type { ComponentType } from "react";
import { pages as overviewPages } from "@/features/overview/registry";
import { pages as verificationPages } from "@/features/verification/registry";
import { pages as aiAnalysisPages } from "@/features/ai-analysis/registry";
import { pages as dataPages } from "@/features/data/registry";
import { pages as workersPages } from "@/features/workers/registry";
import { pages as qualityPages } from "@/features/quality/registry";
import { pages as systemPages } from "@/features/system/registry";
import { pages as categoryPages } from "@/features/category/registry";
import { pages as schemaPages } from "@/features/schema/registry";

export const pageRegistry = {
  ...overviewPages,
  ...verificationPages,
  ...aiAnalysisPages,
  ...dataPages,
  ...workersPages,
  ...qualityPages,
  ...systemPages,
  ...categoryPages,
  ...schemaPages,
} satisfies Record<string, ComponentType>;

export type PageId = keyof typeof pageRegistry;

export function getPageComponent(id: string): ComponentType | null {
  return (pageRegistry as Record<string, ComponentType>)[id] ?? null;
}
