// Interface translations. English is the source of truth: a key missing from
// another locale falls back to English, and a key missing everywhere renders
// as the key itself, so an untranslated string is visible, never blank.
//
// Coverage (first pass): the toolbar, panel titles, the notes and
// preferences panels, the Go-to / search dialogs' headings and the main
// banners. Deeper strings — tag-field labels, validation messages, preset
// names — are still English. The Amharic text below is a draft that needs a
// native speaker's review before it's relied on.

export type Locale = "en" | "am";

export const LOCALES: { id: Locale; label: string }[] = [
  { id: "en", label: "English" },
  { id: "am", label: "አማርኛ (Amharic)" },
];

// Languages that read right-to-left (none ship yet; the hook exists so adding
// e.g. Arabic only needs messages, not layout work).
const RTL: ReadonlySet<Locale> = new Set<Locale>([]);
export const isRtl = (l: Locale): boolean => RTL.has(l);

const en = {
  "toolbar.startSession": "Start editing session",
  "toolbar.loadView": "Load / refresh view",
  "toolbar.addPoint": "Add point",
  "toolbar.addLine": "Add line",
  "toolbar.addArea": "Add area",
  "toolbar.addNote": "Add note",
  "toolbar.save": "Save",
  "toolbar.finish": "Finish",
  "toolbar.wireframe": "Wireframe",
  "toolbar.highlightEdits": "Highlight edits",
  "toolbar.issues": "Issues",
  "toolbar.goTo": "Go to",
  "toolbar.search": "Search",
  "toolbar.autoTrace": "Auto-trace",
  "toolbar.background": "Background",
  "toolbar.mapData": "Map data",
  "toolbar.measure": "Measure",
  "toolbar.history": "History",
  "toolbar.prefs": "Prefs",
  "toolbar.exportOsm": "Export .osm",
  "toolbar.exportChangeset": "Export changeset",
  "toolbar.importOsm": "Import .osm",

  "tip.undo": "Undo (Ctrl+Z)",
  "tip.redo": "Redo (Ctrl+Shift+Z)",
  "tip.note": "Drop a note on the map for someone to check (N)",
  "tip.goTo": "Go to lat/lng, tile z/x/y or bounds (Ctrl/Cmd+G)",
  "tip.search": "Search features, coordinates, tiles and ids (Ctrl/Cmd+F)",
  "tip.background": "Background imagery",
  "tip.mapData": "Map data: show or hide feature types",
  "tip.measure": "Measure the selection",
  "tip.history": "Version history of the selected feature",
  "tip.autoTrace": "Trace roads automatically from a road-mask image",
  "tip.prefs": "Preferences (P)",
  "tip.shortcuts": "Keyboard shortcuts",
  "tip.issues": "Validation issues",

  "banner.zoomIn": "Zoom in to at least level {zoom} to edit.",
  "banner.panToLoad": "Pan/zoom to the area you want, then click “Load / refresh view”.",
  "banner.noData": "No map data in this view yet.",
  "banner.loading": "Loading…",
  "banner.needSession": "Start an editing session to edit or delete this element.",

  "panel.background": "Background",
  "panel.mapData": "Map data",
  "panel.measurement": "Measurement",
  "panel.history": "History",
  "panel.location": "Location",
  "panel.preferences": "Preferences",
  "panel.autoTrace": "Auto-trace roads",
  "panel.issues": "Issues",
  "panel.newNote": "New note",
  "panel.note": "Note #{id}",

  "notes.placeholderNew": "What should someone check here? (e.g. “Is this road still open?”)",
  "notes.create": "Create note",
  "notes.cancel": "Cancel",
  "notes.saving": "Saving…",
  "notes.comment": "Comment",
  "notes.commentPlaceholder": "Add a comment…",
  "notes.resolve": "Resolve",
  "notes.commentResolve": "Comment & resolve",
  "notes.reopen": "Reopen",
  "notes.hide": "Hide this note",
  "notes.open": "Open",
  "notes.resolved": "Resolved",
  "notes.addHint": "Click the map…",

  "prefs.language": "Language",
  "prefs.languageHint": "Applies to the toolbar, panels and dialogs. Some deeper text is still English.",
  "prefs.autosave": "Keep a crash-recovery copy of my edits",
  "prefs.snapping": "Snap to nearby features while drawing",
  "prefs.coords": "Show the coordinates bar",
  "prefs.autoLoad": "Load map data after Go to / search",
  "prefs.reset": "Reset all preferences",
  "prefs.clearRecovery": "Discard saved recovery data",

  "dialog.goTo": "Go to…",
  "dialog.searchPlaceholder": "Search features, coordinates, tiles or ids…",
  "dialog.shortcuts": "Keyboard shortcuts",
  "tab.browsing": "Browsing",
  "tab.editing": "Editing",
  "tab.tools": "Tools",

  "flash.startSession": "Start an editing session first",
  "flash.nothingToSave": "Nothing to save",
  "flash.wireframeOn": "Wireframe on",
  "flash.wireframeOff": "Wireframe off",
  "flash.highlightOn": "Edit highlighting on",
  "flash.highlightOff": "Edit highlighting off",
  "flash.sidebarHidden": "Sidebar hidden",
  "flash.sidebarShown": "Sidebar shown",
  "flash.dataHidden": "Map data hidden",
  "flash.dataShown": "Map data shown",
} as const;

export type MessageKey = keyof typeof en;

const am: Partial<Record<MessageKey, string>> = {
  "toolbar.startSession": "የማስተካከያ ክፍለ ጊዜ ጀምር",
  "toolbar.loadView": "እይታውን ጫን / አድስ",
  "toolbar.addPoint": "ነጥብ ጨምር",
  "toolbar.addLine": "መስመር ጨምር",
  "toolbar.addArea": "ስፍራ ጨምር",
  "toolbar.addNote": "ማስታወሻ ጨምር",
  "toolbar.save": "አስቀምጥ",
  "toolbar.finish": "ጨርስ",
  "toolbar.wireframe": "የሽቦ ፍሬም",
  "toolbar.highlightEdits": "ለውጦችን አጉላ",
  "toolbar.issues": "ችግሮች",
  "toolbar.goTo": "ሂድ ወደ",
  "toolbar.search": "ፈልግ",
  "toolbar.autoTrace": "በራስ-ሰር ተከታተል",
  "toolbar.background": "ዳራ",
  "toolbar.mapData": "የካርታ ውሂብ",
  "toolbar.measure": "ለካ",
  "toolbar.history": "ታሪክ",
  "toolbar.prefs": "ምርጫዎች",
  "toolbar.exportOsm": ".osm ላክ",
  "toolbar.exportChangeset": "ለውጦችን ላክ",
  "toolbar.importOsm": ".osm አስገባ",

  "tip.undo": "ቀልብስ (Ctrl+Z)",
  "tip.redo": "ድገም (Ctrl+Shift+Z)",
  "tip.note": "ለሌላ ሰው እንዲያጣራ በካርታው ላይ ማስታወሻ ተው (N)",
  "tip.goTo": "ወደ ኬክሮስ/ኬንትሮስ፣ ሰቅ z/x/y ወይም ወሰን ሂድ (Ctrl/Cmd+G)",
  "tip.search": "ነገሮችን፣ መጋጠሚያዎችን፣ ሰቆችን እና መለያዎችን ፈልግ (Ctrl/Cmd+F)",
  "tip.background": "የዳራ ምስል",
  "tip.mapData": "የካርታ ውሂብ፦ የነገር ዓይነቶችን አሳይ ወይም ደብቅ",
  "tip.measure": "የተመረጠውን ለካ",
  "tip.history": "የተመረጠው ነገር የስሪት ታሪክ",
  "tip.autoTrace": "ከመንገድ-ጭምብል ምስል መንገዶችን በራስ-ሰር ተከታተል",
  "tip.prefs": "ምርጫዎች (P)",
  "tip.shortcuts": "የቁልፍ ሰሌዳ አቋራጮች",
  "tip.issues": "የማረጋገጫ ችግሮች",

  "banner.zoomIn": "ለማስተካከል ቢያንስ ወደ ደረጃ {zoom} አጉላ።",
  "banner.panToLoad": "የሚፈልጉትን አካባቢ ያንቀሳቅሱ፣ ከዚያ “እይታውን ጫን / አድስ” ን ይጫኑ።",
  "banner.noData": "በዚህ እይታ ውስጥ እስካሁን የካርታ ውሂብ የለም።",
  "banner.loading": "በመጫን ላይ…",
  "banner.needSession": "ይህን ነገር ለማስተካከል ወይም ለመሰረዝ የማስተካከያ ክፍለ ጊዜ ይጀምሩ።",

  "panel.background": "ዳራ",
  "panel.mapData": "የካርታ ውሂብ",
  "panel.measurement": "መለኪያ",
  "panel.history": "ታሪክ",
  "panel.location": "አካባቢ",
  "panel.preferences": "ምርጫዎች",
  "panel.autoTrace": "መንገዶችን በራስ-ሰር ተከታተል",
  "panel.issues": "ችግሮች",
  "panel.newNote": "አዲስ ማስታወሻ",
  "panel.note": "ማስታወሻ #{id}",

  "notes.placeholderNew": "እዚህ ሰው ምን ማጣራት አለበት? (ለምሳሌ “ይህ መንገድ አሁንም ክፍት ነው?”)",
  "notes.create": "ማስታወሻ ፍጠር",
  "notes.cancel": "ተው",
  "notes.saving": "በማስቀመጥ ላይ…",
  "notes.comment": "አስተያየት ስጥ",
  "notes.commentPlaceholder": "አስተያየት ጨምር…",
  "notes.resolve": "ፈታ",
  "notes.commentResolve": "አስተያየት ስጥና ፈታ",
  "notes.reopen": "እንደገና ክፈት",
  "notes.hide": "ይህን ማስታወሻ ደብቅ",
  "notes.open": "ክፍት",
  "notes.resolved": "ተፈቷል",
  "notes.addHint": "ካርታውን ይጫኑ…",

  "prefs.language": "ቋንቋ",
  "prefs.languageHint": "በመሣሪያ አሞሌው፣ በፓነሎችና በመገናኛ ሳጥኖች ላይ ይሠራል። አንዳንድ ጥልቅ ጽሑፎች አሁንም እንግሊዝኛ ናቸው።",
  "prefs.autosave": "የለውጦቼን የአደጋ-ማገገሚያ ቅጂ አቆይ",
  "prefs.snapping": "በሚስልበት ጊዜ ከአቅራቢያ ነገሮች ጋር ተጣበቅ",
  "prefs.coords": "የመጋጠሚያ አሞሌውን አሳይ",
  "prefs.autoLoad": "ከ“ሂድ ወደ”/ፍለጋ በኋላ የካርታ ውሂብ ጫን",
  "prefs.reset": "ሁሉንም ምርጫዎች መልስ",
  "prefs.clearRecovery": "የተቀመጠ የማገገሚያ ውሂብ ጣል",

  "dialog.goTo": "ሂድ ወደ…",
  "dialog.searchPlaceholder": "ነገሮችን፣ መጋጠሚያዎችን፣ ሰቆችን ወይም መለያዎችን ፈልግ…",
  "dialog.shortcuts": "የቁልፍ ሰሌዳ አቋራጮች",
  "tab.browsing": "ማሰስ",
  "tab.editing": "ማስተካከል",
  "tab.tools": "መሣሪያዎች",

  "flash.startSession": "መጀመሪያ የማስተካከያ ክፍለ ጊዜ ይጀምሩ",
  "flash.nothingToSave": "የሚቀመጥ ነገር የለም",
  "flash.wireframeOn": "የሽቦ ፍሬም በርቷል",
  "flash.wireframeOff": "የሽቦ ፍሬም ጠፍቷል",
  "flash.highlightOn": "የለውጥ ማጉላት በርቷል",
  "flash.highlightOff": "የለውጥ ማጉላት ጠፍቷል",
  "flash.sidebarHidden": "የጎን አሞሌ ተደብቋል",
  "flash.sidebarShown": "የጎን አሞሌ ታይቷል",
  "flash.dataHidden": "የካርታ ውሂብ ተደብቋል",
  "flash.dataShown": "የካርታ ውሂብ ታይቷል",
};

const CATALOG: Record<Locale, Partial<Record<MessageKey, string>>> = { en, am };

export function translate(locale: Locale, key: MessageKey, vars?: Record<string, string | number>): string {
  const template = CATALOG[locale][key] ?? en[key] ?? key;
  return vars ? template.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m)) : template;
}

// First-visit default: the browser's language if we have it, else English.
export function detectLocale(navigatorLanguage: string | undefined): Locale {
  const code = (navigatorLanguage ?? "").toLowerCase().split("-")[0];
  return LOCALES.some((l) => l.id === code) ? (code as Locale) : "en";
}

export function isLocale(v: unknown): v is Locale {
  return LOCALES.some((l) => l.id === v);
}
