"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api-config";

// The runnable script itself is NOT duplicated here — it's fetched live
// from PlaceForge's GET /docs/script (scripts/source_ingest_example.py),
// so this page and the real, runnable file can never drift apart.
const SCRIPT_URL = `${API_BASE_URL}/docs/script`;

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="ch">
        <span className="ct">
          Step {n} — {title}
        </span>
      </div>
      <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

function Code({ children }: { children: string }) {
  return (
    <code
      style={{
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        background: "var(--surface-1)",
        padding: "0.15em 0.4em",
        borderRadius: 4,
        fontSize: "90%",
      }}
    >
      {children}
    </code>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        fontSize: 12,
        padding: "4px 10px",
        borderRadius: 6,
        border: "1px solid var(--border-color, #333)",
        background: "var(--surface-2, #1f1f1f)",
        color: "var(--text-primary)",
        cursor: "pointer",
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function AddSourceGuidePage() {
  const [script, setScript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(SCRIPT_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.text();
      })
      .then((text) => {
        if (!cancelled) setScript(text);
      })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Failed to load script.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 16px" }}>
        Three steps: create a source, create a login for your script, run the script.
      </p>

      <Step n={1} title="Create a source on this website">
        <p>This tells PlaceForge where your data is coming from.</p>
        <ol style={{ paddingLeft: "1.3em" }}>
          <li>In the left menu, click <strong>Data</strong>, then <strong>Channels</strong>.</li>
          <li>Click <strong>Create channel</strong>.</li>
          <li>
            Fill in the form:
            <ul style={{ paddingLeft: "1.3em" }}>
              <li><strong>Channel ID</strong> — a short name for your source, e.g. <Code>shega</Code>. Write this down, you&apos;ll need it in Step 3.</li>
              <li><strong>Display name</strong> — the real name of the source, e.g. <Code>Shega</Code>. This is what you&apos;ll see later when looking at where a place&apos;s data came from.</li>
              <li>
                <strong>Channel type</strong> — what kind of source this actually is:
                <ul style={{ paddingLeft: "1.3em" }}>
                  <li>a Telegram channel or bot → <Code>Telegram (bot)</Code> or <Code>Telegram (webhook)</Code></li>
                  <li>WhatsApp → <Code>WhatsApp</Code></li>
                  <li>anything else (your own service, a script, a spreadsheet import) → <Code>REST API (your own service)</Code></li>
                </ul>
              </li>
              <li>
                <strong>Webhook URL</strong> — optional, leave this blank. The script in this guide already gets its result back directly, so it doesn&apos;t need this. It&apos;s only for the rare case where a <em>different</em> system of yours (not the script itself) needs to be told automatically, instead of having to ask. If you do set it, PlaceForge will call it up to <strong>four times</strong> for a given submission, once per thing that happens to it:
                <ul style={{ paddingLeft: "1.3em" }}>
                  <li>right away, once your data lands as a place (tells you its id)</li>
                  <li>if it needed review, again once a human approves or rejects it</li>
                  <li>if it looked like a duplicate, again once a human merges it into another place, or decides it isn&apos;t a duplicate after all</li>
                </ul>
                The <strong>Webhook Secret</strong> field next to it is the same story: optional, only matters if you&apos;re using Webhook URL — set one and PlaceForge signs every call to you so you can verify it&apos;s really from PlaceForge.
              </li>
              <li>Leave everything else as-is.</li>
            </ul>
          </li>
          <li>Click <strong>Create channel</strong>.</li>
        </ol>
      </Step>

      <Step n={2} title="Create a login for your script">
        <p>Your script needs its own login to send data — don&apos;t use your personal one.</p>
        <ol style={{ paddingLeft: "1.3em" }}>
          <li>In the left menu, click <strong>System</strong>, then <strong>Users</strong>.</li>
          <li>Click <strong>Invite user</strong>.</li>
          <li>
            Fill in:
            <ul style={{ paddingLeft: "1.3em" }}>
              <li><strong>Email</strong> — any email, e.g. <Code>ingest-bot@yourcompany.com</Code></li>
              <li><strong>Password</strong> — pick a password</li>
              <li><strong>Role</strong> — choose <Code>SERVICE_ACCOUNT</Code></li>
            </ul>
          </li>
          <li>Click <strong>Invite</strong>. Write down the email and password, your script needs them.</li>
        </ol>
      </Step>

      <Step n={3} title="Write your script">
        <p>
          Copy the script below into a file named <Code>ingest.py</Code>. At the top, fill
          in the Channel ID, Channel type, email, and password from Steps 1 and 2 —{" "}
          <Code>CHANNEL_TYPE</Code> must match what you picked in Step 1 (<Code>&quot;TELEGRAM_BOT&quot;</Code>,{" "}
          <Code>&quot;WHATSAPP_WEBHOOK&quot;</Code>, <Code>&quot;REST_API&quot;</Code>, etc.).
        </p>
        {error && (
          <p style={{ color: "var(--text-danger)" }}>
            Couldn&apos;t load the script from PlaceForge ({error}). Is the backend running?
          </p>
        )}
        {!error && script === null && <p style={{ color: "var(--text-muted)" }}>Loading script…</p>}
        {script !== null && (
          <div style={{ position: "relative" }}>
            <CopyButton text={script} />
            <pre
              style={{
                background: "var(--surface-1)",
                padding: 16,
                borderRadius: 8,
                overflowX: "auto",
                fontSize: 12,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
              }}
            >
              <code>{script}</code>
            </pre>
          </div>
        )}
      </Step>

      <Step n={4} title="Run it">
        <p>Open a terminal in the same folder as <Code>ingest.py</Code> and run:</p>
        <div style={{ position: "relative" }}>
          <CopyButton text={"pip install requests\npython3 ingest.py"} />
          <pre
            style={{
              background: "var(--surface-1)",
              padding: 16,
              borderRadius: 8,
              overflowX: "auto",
              fontSize: 12,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            }}
          >
            <code>{"pip install requests\npython3 ingest.py"}</code>
          </pre>
        </div>
        <p>
          If it worked, you&apos;ll see messages like{" "}
          <Code>&apos;Tomoca Coffee&apos;: ai_decision=VALID place_id=5</Code>.
        </p>
      </Step>

      <Step n={5} title="Find your data afterward">
        <p>Every place remembers which source it came from, so you can always look this up later:</p>
        <ol style={{ paddingLeft: "1.3em" }}>
          <li>In the left menu, click <strong>Place</strong>, then <strong>List</strong>.</li>
          <li>Click <strong>Filters</strong>, then use the <strong>Source</strong> dropdown to pick a kind of source (e.g. all Telegram channels), or the dropdown next to it to pick one specific source by name (e.g. just <Code>Shega</Code>).</li>
          <li>The table&apos;s <strong>Source</strong> column also shows this for every place, without filtering.</li>
        </ol>
      </Step>
    </div>
  );
}
