"use client";

// The note panel — a new note's text form, or an existing note's comment
// thread with Comment / Resolve / Reopen / Hide. Notes need no changeset:
// they're feedback ("is this road still open?"), not map edits.

import { useState } from "react";
import { cn } from "@/lib/utils";
import { closeNote, commentNote, createNote, hideNote, reopenNote } from "../api";
import type { OsmNote, OsmNoteComment } from "../types";
import type { EditorStore } from "../useEditorStore";
import PanelShell from "./PanelShell";

const MAX_LEN = 2000;
const inputClass =
  "w-full resize-y rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-2.5 py-1.5 text-[12px] text-[color:var(--text-primary)] outline-none focus:border-[color:var(--orange-400)]/50";
const btn =
  "rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1.5 text-[12px] font-medium text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-3)] disabled:opacity-40";
const primary =
  "rounded-lg border border-[color:var(--orange-400)]/30 bg-[color:var(--orange-500)]/12 px-3 py-1.5 text-[12px] font-medium text-[color:var(--orange-400)] transition hover:bg-[color:var(--orange-500)]/20 disabled:opacity-40";

const EVENT_LABEL: Record<OsmNoteComment["event"], string> = {
  opened: "opened this note",
  commented: "commented",
  closed: "resolved this note",
  reopened: "reopened this note",
  hidden: "hid this note",
};

function Counter({ value }: { value: string }) {
  return <span className={cn("text-[10px]", value.length > MAX_LEN ? "text-[color:var(--text-danger)]" : "text-[color:var(--text-muted)]")}>{value.length}/{MAX_LEN}</span>;
}

function NewNote({ store, onClose }: { store: EditorStore; onClose: () => void }) {
  const draft = store.noteDraft;
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!draft) return null;

  async function save() {
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      const note = await createNote(draft.lat, draft.lon, text);
      store.upsertNote(note);
      store.setNoteDraft(null);
      store.setMode("browse");
      store.selectNote(note.id);
      store.flash(`Note #${note.id} created`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save the note");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PanelShell title={store.t("panel.newNote")} onClose={onClose}>
      <div className="font-mono text-[11px] text-[color:var(--text-muted)]">
        {draft.lat.toFixed(6)}, {draft.lon.toFixed(6)}
      </div>
      <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder={store.t("notes.placeholderNew")} className={inputClass} />
      <div className="flex items-center justify-between">
        <Counter value={text} />
        <span className="flex gap-2">
          <button type="button" className={btn} onClick={onClose}>
            {store.t("notes.cancel")}
          </button>
          <button type="button" className={primary} disabled={busy || text.trim() === "" || text.length > MAX_LEN} onClick={() => void save()}>
            {busy ? store.t("notes.saving") : store.t("notes.create")}
          </button>
        </span>
      </div>
      {error ? <div className="text-[11px] text-[color:var(--text-danger)]">{error}</div> : null}
      <div className="text-[10px] text-[color:var(--text-muted)]">Notes are visible to everyone who can see the map. Don&apos;t put private details in them.</div>
    </PanelShell>
  );
}

function Thread({ store, note, onClose }: { store: EditorStore; note: OsmNote; onClose: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closed = note.status === "closed";

  async function run(fn: () => Promise<OsmNote | void>, done?: string) {
    setBusy(true);
    setError(null);
    try {
      const result = await fn();
      if (result) store.upsertNote(result);
      setText("");
      if (done) store.flash(done);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't work");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PanelShell title={store.t("panel.note", { id: note.id })} onClose={onClose}>
      <div className="flex items-center gap-2">
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", closed ? "bg-[color:var(--text-success)]/15 text-[color:var(--text-success)]" : "bg-[color:var(--text-danger)]/15 text-[color:var(--text-danger)]")}>
          {closed ? store.t("notes.resolved") : store.t("notes.open")}
        </span>
        <span className="font-mono text-[10px] text-[color:var(--text-muted)]">
          {note.lat.toFixed(5)}, {note.lon.toFixed(5)}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {note.comments.map((c) => (
          <div key={c.id} className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] p-2">
            <div className="flex items-baseline justify-between gap-2 text-[10px] text-[color:var(--text-muted)]">
              <span>
                <span className="font-medium text-[color:var(--text-secondary)]">{c.user || "Someone"}</span> {EVENT_LABEL[c.event]}
              </span>
              <span className="shrink-0">{new Date(c.date).toLocaleString()}</span>
            </div>
            {c.text ? <div className="mt-1 whitespace-pre-wrap break-words text-[12px] text-[color:var(--text-primary)]">{c.text}</div> : null}
          </div>
        ))}
      </div>

      {!closed ? (
        <>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder={store.t("notes.commentPlaceholder")} className={inputClass} />
          <div className="flex items-center justify-between">
            <Counter value={text} />
            <span className="flex gap-2">
              <button type="button" className={btn} disabled={busy} onClick={() => void run(() => closeNote(note.id, text), "Note resolved")}>
                {text.trim() ? store.t("notes.commentResolve") : store.t("notes.resolve")}
              </button>
              <button type="button" className={primary} disabled={busy || text.trim() === "" || text.length > MAX_LEN} onClick={() => void run(() => commentNote(note.id, text), "Comment added")}>
                {store.t("notes.comment")}
              </button>
            </span>
          </div>
        </>
      ) : (
        <div className="flex justify-end">
          <button type="button" className={btn} disabled={busy} onClick={() => void run(() => reopenNote(note.id), "Note reopened")}>
            {store.t("notes.reopen")}
          </button>
        </div>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() =>
          void run(async () => {
            await hideNote(note.id);
            store.removeNote(note.id);
          }, "Note hidden")
        }
        className="self-start text-[11px] text-[color:var(--text-muted)] underline transition hover:text-[color:var(--text-danger)] disabled:opacity-40"
      >
        {store.t("notes.hide")}
      </button>
      {error ? <div className="text-[11px] text-[color:var(--text-danger)]">{error}</div> : null}
    </PanelShell>
  );
}

export default function NotesPanel({ store }: { store: EditorStore }) {
  const note = store.selectedNoteId !== null ? store.notes.find((n) => n.id === store.selectedNoteId) : undefined;
  if (store.noteDraft) {
    return (
      <NewNote
        key={`${store.noteDraft.lat}:${store.noteDraft.lon}`}
        store={store}
        onClose={() => {
          store.setNoteDraft(null);
          store.setMode("browse");
        }}
      />
    );
  }
  if (note) return <Thread key={note.id} store={store} note={note} onClose={() => store.selectNote(null)} />;
  return null;
}
