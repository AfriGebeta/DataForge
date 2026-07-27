import type { ComponentType } from "react";
import PlaceListPage from "./places/sections/place-list/PlaceListPage";
import PlaceAddPage from "./places/sections/place-add/PlaceAddPage";
import PlaceUpdatePage from "./places/sections/place-update/PlaceUpdatePage";
import PlaceDeletePage from "./places/sections/place-delete/PlaceDeletePage";

export const pages = {
  "place-list": PlaceListPage,
  "place-add": PlaceAddPage,
  "place-update": PlaceUpdatePage,
  "place-delete": PlaceDeletePage,
} satisfies Record<string, ComponentType>;

export type PageId = keyof typeof pages;
