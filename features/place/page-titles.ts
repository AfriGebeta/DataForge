import { pageConfig as PlaceListConfig } from "./places/sections/place-list/config";
import { pageConfig as PlaceAddConfig } from "./places/sections/place-add/config";
import { pageConfig as PlaceUpdateConfig } from "./places/sections/place-update/config";
import { pageConfig as PlaceDeleteConfig } from "./places/sections/place-delete/config";

export const pageTitles = {
  [PlaceListConfig.id]: PlaceListConfig.title,
  [PlaceAddConfig.id]: PlaceAddConfig.title,
  [PlaceUpdateConfig.id]: PlaceUpdateConfig.title,
  [PlaceDeleteConfig.id]: PlaceDeleteConfig.title,
} as const;
