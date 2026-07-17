import type { MergeStrategy } from "../../../types";

type Props = {
  strategy: MergeStrategy;
};

export default function StrategyBadge({ strategy }: Props) {
  const map: Record<MergeStrategy, string> = {
    AUTO_DISTANCE: "bx a",
    AUTO_NAME_MATCH: "bx s",
    MANUAL: "bx m",
    AUTO_OVERLAP: "bx w",
  };
  return <span className={map[strategy]}>{strategy}</span>;
}