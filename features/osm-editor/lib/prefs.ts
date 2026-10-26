// Persisted display preferences — map-editor-full-spec.md §1.11:
// wireframe/highlight-edits toggles survive a reload, scoped to this
// one localStorage key so they don't collide with any other feature's
// prefs.

import { isLocale, type Locale } from "./i18n";

const KEY = "osm-editor:prefs";

export interface ImagerySettings {
  id: string; // key into lib/imagery.ts's catalog, or "custom"
  opacity: number; // 0.1 - 1
  offsetX: number; // meters east (+) — corrects imagery that's shifted vs. the ground
  offsetY: number; // meters north (+)
  customUrl: string; // XYZ template used when id === "custom"
}

export interface EditorPrefs {
  wireframe: boolean;
  highlightEdits: boolean;
  imagery: ImagerySettings;
  // Feature-filter category ids (lib/featureFilters.ts) the user hid.
  hiddenFeatures: string[];
  // Behavior (Preferences panel):
  autosave: boolean; // keep a crash-recovery copy of unsaved edits in this browser
  snapping: boolean; // snap to nearby features while drawing (Alt inverts)
  showCoords: boolean; // the zoom · lat,lng · tile status bar
  autoLoad: boolean; // Go to / search also load the map data there
  locale: Locale; // interface language
}

export const DEFAULT_IMAGERY: ImagerySettings = { id: "osm", opacity: 1, offsetX: 0, offsetY: 0, customUrl: "" };

export const DEFAULT_PREFS: EditorPrefs = { wireframe: false, highlightEdits: false, imagery: DEFAULT_IMAGERY, hiddenFeatures: [], autosave: true, snapping: true, showCoords: true, autoLoad: true, locale: "en" };

export function loadPrefs(): EditorPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<EditorPrefs>;
    return {
      ...DEFAULT_PREFS,
      ...parsed,
      // nested object: merge so prefs saved before a field existed still load
      imagery: { ...DEFAULT_IMAGERY, ...(parsed.imagery ?? {}) },
      hiddenFeatures: Array.isArray(parsed.hiddenFeatures) ? parsed.hiddenFeatures : [],
      locale: isLocale(parsed.locale) ? parsed.locale : "en",
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: EditorPrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // private-browsing / quota — losing a display preference isn't worth surfacing an error over
  }
}

// True once the user (or the app) has stored any preference — used to tell
// "chose English" apart from "never chose", so a first visit can default to
// the browser's language.
export function hasSavedPrefs(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}
