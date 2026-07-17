import type { PlaceType } from "../../../types";

type Props = {
  placeType: PlaceType;
};

export default function PlaceTypeBadge({ placeType }: Props) {
  const map: Record<PlaceType, string> = {
    POI: "bx a",
    ROAD: "bx m",
    BUILDING: "bx m",
    MUNICIPALITY: "bx m",
    TRANSIT_STOP: "bx m",
  };
  return <span className={map[placeType]}>{placeType}</span>;
}