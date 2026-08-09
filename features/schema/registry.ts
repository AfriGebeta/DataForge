import type { ComponentType } from "react";
import WorkerSchemasPage from "./worker-schemas";

export const pages = {
  "worker-schemas": WorkerSchemasPage,
} satisfies Record<string, ComponentType>;
