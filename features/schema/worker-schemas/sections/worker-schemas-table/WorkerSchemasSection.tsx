import { motion } from "framer-motion";
import { FileCode2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WorkerSchema } from "../../types";

type Props = {
  schemas: WorkerSchema[];
  loading: boolean;
  onCreate: () => void;
  onEdit: (schema: WorkerSchema) => void;
};

const item = {
  hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring" as const, stiffness: 220, damping: 24 } },
};

export default function WorkerSchemasSection({ schemas, loading, onCreate, onEdit }: Props) {
  const active = schemas.filter((s) => s.isActive).length;
  const inactive = schemas.filter((s) => !s.isActive).length;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-5 pb-2 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-[color:var(--text-success)]" style={{ animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--text-muted)" }}>
              Live · Schema Registry
            </span>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.02em", marginTop: 8 }}>Worker Schemas</h2>
          <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 6 }}>
            Validation schemas for worker-processed data outputs.{" "}
            <span style={{ color: "var(--text-accent)" }}>{active} active · {inactive} inactive</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition"
          style={{ border: "1px solid rgba(232,104,21,0.3)", background: "rgba(208,90,11,0.12)", color: "var(--orange-400)" }}
        >
          <Plus className="h-3.5 w-3.5" />
          Create schema
        </button>
      </div>

      <motion.div variants={item} initial="hidden" animate="show">
        <Card className="glass-surface glass-glow relative overflow-hidden border-0 py-0">
          <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--surface-2)] ring-1 ring-inset ring-[color:var(--border)]">
                <FileCode2 className="h-4 w-4 text-[color:var(--text-secondary)]" />
              </div>
              <CardTitle className="font-display text-[14px] font-semibold text-[color:var(--text-primary)]">
                Registered Schemas
              </CardTitle>
            </div>
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-[color:var(--text-muted)]">versioned</span>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-5">
            {loading ? (
              <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Loading...</p>
            ) : schemas.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: 12 }}>No schemas found.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg ring-1 ring-inset ring-[color:var(--border)]">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="bg-[color:var(--surface-1)] text-[10px] uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
                      <th className="px-5 py-3.5 font-medium">Name</th>
                      <th className="px-5 py-3.5 font-medium">Version</th>
                      <th className="px-5 py-3.5 font-medium">Description</th>
                      <th className="px-5 py-3.5 font-medium">Status</th>
                      <th className="px-5 py-3.5 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schemas.map((schema, i) => (
                      <motion.tr
                        key={schema.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.32, delay: 0.1 + i * 0.06, ease: "easeOut" }}
                        onClick={() => onEdit(schema)}
                        className="border-t border-[color:var(--border)] transition hover:bg-[color:var(--surface-2)]"
                        style={{ cursor: "pointer" }}
                      >
                        <td className="px-5 py-3.5 font-mono text-[11.5px] font-medium text-[color:var(--text-primary)]">{schema.name}</td>
                        <td className="px-5 py-3.5 font-mono text-[11.5px] tabular-nums text-[color:var(--text-secondary)]">v{schema.version}</td>
                        <td className="px-5 py-3.5 text-[11.5px] text-[color:var(--text-muted)]">
                          {schema.description ?? <span style={{ color: "var(--text-muted)" }}>—</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-mono tracking-wide text-[10px] px-2 py-0.5 min-w-[70px] justify-center",
                              schema.isActive
                                ? "bg-[color:var(--text-success)]/12 text-[color:var(--text-success)] border-[color:var(--text-success)]/25"
                                : "bg-[color:var(--text-warning)]/12 text-[color:var(--text-warning)] border-[color:var(--text-warning)]/25",
                            )}
                          >
                            {schema.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-[11.5px] text-[color:var(--text-muted)]">
                          {new Date(schema.createdAt).toLocaleDateString()}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
