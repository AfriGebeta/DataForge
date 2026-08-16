import { useState } from "react";

type Props = {
  allowedLanguages: string[];
  onChange: (value: string[]) => void;
};

// Comma-separated ISO 639-1 codes, e.g. "en,am" — kept as free text while
// editing (not split on every keystroke) so typing a comma doesn't fight
// the user; parsed to the array PUT /settings expects only on blur/commit.
export default function AllowedLanguagesCard({ allowedLanguages, onChange }: Props) {
  // Defensive against an older backend that doesn't return this field yet
  // (pre-migration PlaceForge instance still running) - falls back to "no
  // restriction configured" instead of crashing.
  const [draft, setDraft] = useState((allowedLanguages ?? []).join(", "));

  const commit = () => {
    const parsed = draft
      .split(",")
      .map((code) => code.trim().toLowerCase())
      .filter(Boolean);
    setDraft(parsed.join(", "));
    onChange(parsed);
  };

  return (
    <div className="card">
      <div className="ch">
        <span className="ct">
          <i className="ti ti-language" style={{ fontSize: 14, marginRight: 5 }} />
          Allowed Languages
        </span>
      </div>
      <div className="fg">
        <div className="fl">ISO 639-1 codes a place name is allowed to be written in</div>
        <input
          type="text"
          placeholder="e.g. en, am"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
        />
        <div className="fh">
          GeoValidate flags a place &ldquo;out of allowed language&rdquo; if its name contains
          any script outside this list — even mixed with an allowed one. Leave empty to disable
          the check entirely.
        </div>
      </div>
    </div>
  );
}
