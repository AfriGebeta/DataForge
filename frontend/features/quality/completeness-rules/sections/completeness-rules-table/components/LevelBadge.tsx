import type { CompletenessLevel } from "../../../types";

type Props = {
  level: CompletenessLevel;
};

export default function LevelBadge({ level }: Props) {
  const map: Record<CompletenessLevel, string> = {
    MINIMAL: "bx d",
    PARTIAL: "bx w",
    GOOD: "bx a",
    COMPLETE: "bx s",
  };
  return <span className={map[level]}>{level}</span>;
}