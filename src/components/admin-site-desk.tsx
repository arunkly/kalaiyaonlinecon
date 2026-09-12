import { useEffect, useState } from "react";
import { CHROME_MODULES, type ChromeKey } from "@/lib/chrome-nav";
import { DEFAULT_SITE, getSiteIdentity, saveSiteIdentity } from "@/lib/site";

const field =
  "mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3 outline-none focus:border-crimson";

function ModulePicks({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: ChromeKey[];
  onChange: (next: ChromeKey[]) => void;
}) {
  return (
    <fieldset className="rounded-2xl border border-line p-4">
      <legend className="px-1 text-sm font-semibold">{label}</legend>
      <p className="mb-3 text-xs text-muted">{hint}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {CHROME_MODULES.map((item) => {
          const on = value.includes(item.key);
          return (
            <label key={item.key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={on}
                onChange={() =>
                  onChange(on ? value.filter((k) => k !== item.key) : [...value, item.key])
                }
              />
              {item.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function SiteDeskPanel() {
  const [name, setName] = useState(DEFAULT_SITE.name);
  const [nameNp, setNameNp] = useState(DEFAULT_SITE.nameNp);
  const [tagline, setTagline] = useState(DEFAULT_SITE.tagline);
  const [description, setDescription] = useState(DEFAULT_SITE.description);
  const [searchHint, setSearchHint] = useState(DEFAULT_SITE.searchHint);
  const [website, setWebsite] = useState(DEFAULT_SITE.website);
  const [bottomBar, setBottomBar] = useState<ChromeKey[]>(DEFAULT_SITE.bottomBar);
  const [footerMenu, setFooterMenu] = useState<ChromeKey[]>(DEFAULT_SITE.footerMenu);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function refresh() {
    void getSiteIdentity()
      .then((s) => {
        setName(s.name);
        setNameNp(s.nameNp);
        setTagline(s.tagline);
        setDescription(s.description);
        setSearchHint(s.searchHint);
        setWebsite(s.website);
        setBottomBar(s.bottomBar);
        setFooterMenu(s.footerMenu);
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <section className="space-y-3 rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-display text-2xl">साइट सेटिङ</h2>
      <p className="text-sm text-muted">
        साइटको नाम, डोमेन, ट्यागलाइन, बटम बार र फुटर मेनु यहाँबाट बदलिन्छ। नाम वा डोमेन बदलिए गोपनीयता नीति आफैं अद्यावधिक हुन्छ।
      </p>
      {error ? <p className="text-sm text-mark">{error}</p> : null}
      {ok ? <p className="text-sm font-semibold text-[#14934e]">{ok}</p> : null}
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setSaving(true);
          setError(null);
          setOk(null);
          void saveSiteIdentity({
            data: { name, nameNp, tagline, description, searchHint, website, bottomBar, footerMenu },
          })
            .then(() => {
              setOk("साइट सेटिङ सेभ भयो। पेज रिफ्रेस गर्नुहोस्।");
              refresh();
            })
            .catch((err) => setError(err instanceof Error ? err.message : "सेभ भएन।"))
            .finally(() => setSaving(false));
        }}
      >
        <label className="text-sm font-medium">
          साइट नाम (अंग्रेजी)
          <input value={name} onChange={(e) => setName(e.target.value)} required className={field} />
        </label>
        <label className="text-sm font-medium">
          साइट नाम (नेपाली)
          <input value={nameNp} onChange={(e) => setNameNp(e.target.value)} required className={field} />
        </label>
        <label className="text-sm font-medium">
          ट्यागलाइन
          <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={field} />
        </label>
        <label className="text-sm font-medium">
          छोटो विवरण
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={field}
          />
        </label>
        <label className="text-sm font-medium">
          खोज बाकसको पाठ
          <input value={searchHint} onChange={(e) => setSearchHint(e.target.value)} className={field} />
        </label>
        <label className="text-sm font-medium">
          साइट डोमेन
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://kalaiyaonline.com"
            className={field}
          />
        </label>
        <ModulePicks
          label="बटम बार"
          hint="मोबाइल तलको बारमा देखिने मोड्युल। मोड्युल फिचर बन्द भए देखिँदैन।"
          value={bottomBar}
          onChange={setBottomBar}
        />
        <ModulePicks
          label="फुटर मेनु"
          hint="साइट फुटर र बटम बारको मेनु प्यानलमा देखिने लिंक।"
          value={footerMenu}
          onChange={setFooterMenu}
        />
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-crimson px-5 text-sm font-semibold text-paper disabled:opacity-60"
        >
          {saving ? "सेभ हुँदै…" : "सेभ गर्नुहोस्"}
        </button>
      </form>
    </section>
  );
}
