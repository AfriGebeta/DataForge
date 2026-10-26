"use client";

// Preferences (P) — iD's Preferences pane. Everything here is stored in this
// browser only (localStorage), never on the server.

import { clearSnapshot } from "../lib/autosave";
import { LOCALES, isLocale } from "../lib/i18n";
import type { EditorStore } from "../useEditorStore";
import PanelShell from "./PanelShell";

function Check({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-2">
      <input type="checkbox" className="mt-0.5" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="block text-[12px] text-[color:var(--text-primary)]">{label}</span>
        <span className="block text-[10px] text-[color:var(--text-muted)]">{hint}</span>
      </span>
    </label>
  );
}

const btn =
  "rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-2 py-1 text-[11px] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-3)]";

export default function PreferencesPanel({ store, onClose }: { store: EditorStore; onClose: () => void }) {
  return (
    <PanelShell title={store.t("panel.preferences")} onClose={onClose}>
      <label className="block">
        <span className="mb-0.5 block text-[12px] text-[color:var(--text-primary)]">{store.t("prefs.language")}</span>
        <select
          value={store.locale}
          onChange={(e) => isLocale(e.target.value) && store.setLocale(e.target.value)}
          className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-2 py-1 text-[12px] text-[color:var(--text-primary)] outline-none"
        >
          {LOCALES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
        <span className="mt-0.5 block text-[10px] text-[color:var(--text-muted)]">{store.t("prefs.languageHint")}</span>
      </label>
      <Check
        label={store.t("prefs.autosave")}
        hint="Unsaved edits are saved in this browser so a crash or reload can offer them back. Turn off on a shared computer."
        checked={store.autosave}
        onChange={store.setAutosave}
      />
      <Check label={store.t("prefs.snapping")} hint="Hold Alt to do the opposite for a single click." checked={store.snapping} onChange={store.setSnapping} />
      <Check label={store.t("prefs.coords")} hint="Zoom, pointer lat/lng and the z/x/y tile under it (⌘/Ctrl+I)." checked={store.showCoords} onChange={store.setShowCoords} />
      <Check label={store.t("prefs.autoLoad")} hint="Off = just fly there; use “Load / refresh view” when you're ready." checked={store.autoLoad} onChange={store.setAutoLoad} />

      <div className="mt-1 flex flex-wrap gap-1.5">
        <button
          type="button"
          className={btn}
          onClick={() => {
            clearSnapshot();
            store.dismissRecovery();
            store.flash("Recovery data cleared");
          }}
        >
          {store.t("prefs.clearRecovery")}
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => {
            store.resetPrefs();
            store.flash("Preferences reset");
          }}
        >
          {store.t("prefs.reset")}
        </button>
      </div>
    </PanelShell>
  );
}
