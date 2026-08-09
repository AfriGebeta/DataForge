import type { PlaceType } from "../../types";

type Props = {
  placeType: PlaceType;
};

export default function PlaceTypeBadge({ placeType }: Props) {
  const map: Record<PlaceType, string> = {
    COUNTRY: "bx s",
    PROVINCE: "bx s",
    COUNTY: "bx s",
    MUNICIPALITY: "bx s",
    BOROUGH: "bx s",
    DISTRICT: "bx s",
    VILLAGE: "bx s",
    POSTAL_CODE: "bx s",
    CUSTOM_ZONE: "bx s",
    ROAD: "bx m",
    TRANSIT_LINE: "bx m",
    TRANSIT_STOP: "bx m",
    BUILDING: "bx m",
    NATURAL_FEATURE: "bx w",
    POI: "bx a",
  };
  return <span className={map[placeType]}>{placeType}</span>;
}