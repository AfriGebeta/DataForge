import type { FlagSeverity } from "../../../types";

type Props = { severity: FlagSeverity };

export default function SeverityBadge({ severity }: Props) {
  const map: Record<FlagSeverity, string> = {
    CRITICAL: "bx d",
    ERROR: "bx d",
    WARNING: "bx w",
    INFO: "bx a",
  };
  return <span className={map[severity]}>{severity}</span>;
}