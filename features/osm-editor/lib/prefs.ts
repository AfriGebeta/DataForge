// Persisted display preferences — map-editor-full-spec.md §1.11:
// wireframe/highlight-edits toggles survive a reload, scoped to this
// one localStorage key so they don't collide with any other feature's
// prefs.

const KEY = "osm-editor:prefs";

export interface EditorPrefs {
  wireframe: boolean;
  highlightEdits: boolean;
}

const DEFAULT_PREFS: EditorPrefs = { wireframe: false, highlightEdits: false };

export function loadPrefs(): EditorPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<EditorPrefs>) };
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
