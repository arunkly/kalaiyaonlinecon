import { useEffect, useState } from "react";
import {
  COLOR_PRESETS,
  DEFAULT_THEME,
  THEME_FONTS,
  getThemeSettings,
  saveThemeSettings,
  type ThemeFontId,
} from "@/lib/theme";

const field =
  "mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3 outline-none focus:border-crimson";

export function ThemeDeskPanel() {
  const [logoUrl, setLogoUrl] = useState(DEFAULT_THEME.logoUrl);
  const [logoDarkUrl, setLogoDarkUrl] = useState(DEFAULT_THEME.logoDarkUrl);
  const [primary, setPrimary] = useState(DEFAULT_THEME.primary);
  const [accent, setAccent] = useState(DEFAULT_THEME.accent);
  const [font, setFont] = useState<ThemeFontId>(DEFAULT_THEME.font);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function refresh() {
    void getThemeSettings()
      .then((t) => {
        setLogoUrl(t.logoUrl);
        setLogoDarkUrl(t.logoDarkUrl);
        setPrimary(t.primary);
        setAccent(t.accent);
        setFont(t.font);
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-display text-2xl">रूप रङ र लोगो</h2>
      <p className="text-sm text-muted">हेडर लोगो, रङ योजना र अक्षर यहाँबाट बदलिन्छ।</p>
      {error ? <p className="text-sm text-mark">{error}</p> : null}
      {ok ? <p className="text-sm font-semibold text-[#14934e]">{ok}</p> : null}

      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          setSaving(true);
          setError(null);
          setOk(null);
          void saveThemeSettings({ data: { logoUrl, logoDarkUrl, primary, accent, font } })
            .then(() => {
              setOk("रूप सेभ भयो। पेज रिफ्रेस गर्नुहोस्।");
              refresh();
            })
            .catch((err) => setError(err instanceof Error ? err.message : "सेभ भएन।"))
            .finally(() => setSaving(false));
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            हेडर लोगो (बाह्य लिंक)
            <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="/logo.jpg वा https://..." className={field} />
            <img src={logoUrl || "/logo.jpg"} alt="" className="mt-2 h-12 w-auto rounded bg-white p-1" />
          </label>
          <label className="text-sm font-medium">
            फुटर / डार्क लोगो
            <input value={logoDarkUrl} onChange={(e) => setLogoDarkUrl(e.target.value)} placeholder="/logo-dark.jpg वा https://..." className={field} />
            <img src={logoDarkUrl || "/logo-dark.jpg"} alt="" className="mt-2 h-12 w-auto rounded bg-[#10261a] p-1" />
          </label>
        </div>

        <div>
          <p className="text-sm font-medium">रङ योजना</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {COLOR_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPrimary(p.primary);
                  setAccent(p.accent);
                }}
                className="flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm"
              >
                <span className="size-4 rounded-full" style={{ background: p.primary }} />
                <span className="size-4 rounded-full" style={{ background: p.accent }} />
                {p.label}
              </button>
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">
              मुख्य रङ
              <span className="mt-1 flex items-center gap-2">
                <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value.toUpperCase())} className="h-11 w-14 cursor-pointer rounded border border-line" />
                <input value={primary} onChange={(e) => setPrimary(e.target.value)} className={field + " mt-0"} />
              </span>
            </label>
            <label className="text-sm font-medium">
              सहायक रङ
              <span className="mt-1 flex items-center gap-2">
                <input type="color" value={accent} onChange={(e) => setAccent(e.target.value.toUpperCase())} className="h-11 w-14 cursor-pointer rounded border border-line" />
                <input value={accent} onChange={(e) => setAccent(e.target.value)} className={field + " mt-0"} />
              </span>
            </label>
          </div>
          <div className="mt-3 flex overflow-hidden rounded-xl border border-line">
            <div className="h-10 flex-1" style={{ background: primary }} />
            <div className="h-10 flex-1" style={{ background: accent }} />
          </div>
        </div>

        <label className="block text-sm font-medium">
          अक्षर / टाइपोग्राफी
          <select value={font} onChange={(e) => setFont(e.target.value as ThemeFontId)} className={field}>
            {THEME_FONTS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
          <p className="mt-2 font-display text-xl" style={{ fontFamily: THEME_FONTS.find((f) => f.id === font)?.stack }}>
            कलैया अनलाइन — स्थानीय समाचार
          </p>
        </label>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-11 items-center rounded-md bg-crimson px-4 text-sm font-semibold text-paper disabled:opacity-60"
        >
          {saving ? "सेभ हुँदै…" : "रूप सेभ गर्नुहोस्"}
        </button>
      </form>
    </section>
  );
}
