import { placeConfig } from "./config";
import { pageConfig as PlaceListConfig } from "./places/sections/place-list/config";
import { pageConfig as PlaceAddConfig } from "./places/sections/place-add/config";
import { pageConfig as PlaceUpdateConfig } from "./places/sections/place-update/config";
import { pageConfig as PlaceDeleteConfig } from "./places/sections/place-delete/config";
import type { FeatureNavGroup } from "@/features/shared/types";

const items = [
  PlaceListConfig,
  PlaceAddConfig,
  PlaceUpdateConfig,
  PlaceDeleteConfig,
];

export const navGroup: FeatureNavGroup = {
  ...placeConfig,
  items,
};
