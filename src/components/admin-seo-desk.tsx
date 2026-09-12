import { useEffect, useState } from "react";
import { DEFAULT_SEO, getSeoSettings, saveSeoSettings } from "@/lib/seo";

const field =
  "mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3 outline-none focus:border-crimson";

export function SeoDeskPanel() {
  const [siteName, setSiteName] = useState(DEFAULT_SEO.siteName);
  const [title, setTitle] = useState(DEFAULT_SEO.title);
  const [description, setDescription] = useState(DEFAULT_SEO.description);
  const [keywords, setKeywords] = useState(DEFAULT_SEO.keywords);
  const [ogImage, setOgImage] = useState(DEFAULT_SEO.ogImage);
  const [canonicalUrl, setCanonicalUrl] = useState(DEFAULT_SEO.canonicalUrl);
  const [googleVerify, setGoogleVerify] = useState("");
  const [robots, setRobots] = useState(DEFAULT_SEO.robots);
  const [twitter, setTwitter] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function refresh() {
    void getSeoSettings()
      .then((s) => {
        setSiteName(s.siteName);
        setTitle(s.title);
        setDescription(s.description);
        setKeywords(s.keywords);
        setOgImage(s.ogImage);
        setCanonicalUrl(s.canonicalUrl);
        setGoogleVerify(s.googleVerify);
        setRobots(s.robots);
        setTwitter(s.twitter);
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <section className="space-y-3 rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-display text-2xl">SEO सेटिङ</h2>
      <p className="text-sm text-muted">
        गुगल र सामाजिक सञ्जालमा साइट कसरी देखिन्छ भन्ने शीर्षक, विवरण र तस्बिर यहाँबाट सेट हुन्छ।
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
          void saveSeoSettings({
            data: {
              siteName,
              title,
              description,
              keywords,
              ogImage,
              canonicalUrl,
              googleVerify,
              robots,
              twitter,
            },
          })
            .then(() => {
              setOk("SEO सेटिङ सेभ भयो।");
              refresh();
            })
            .catch((err) => setError(err instanceof Error ? err.message : "सेभ भएन।"))
            .finally(() => setSaving(false));
        }}
      >
        <label className="text-sm font-medium">
          साइट नाम
          <input value={siteName} onChange={(e) => setSiteName(e.target.value)} required className={field} />
        </label>
        <label className="text-sm font-medium">
          पेज शीर्षक (Google title)
          <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} className={field} />
          <span className="mt-1 block text-[11px] text-muted">{title.length}/१२० अक्षर</span>
        </label>
        <label className="text-sm font-medium">
          मेटा विवरण
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            maxLength={320}
            className={field}
          />
          <span className="mt-1 block text-[11px] text-muted">{description.length}/३२० अक्षर</span>
        </label>
        <label className="text-sm font-medium">
          कीवर्ड (अल्पविरामले छुट्याउनुहोस्)
          <input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="कलैया, बारा, समाचार"
            className={field}
          />
        </label>
        <label className="text-sm font-medium">
          OG / सेयर तस्बिर (बाह्य लिंक वा /og.jpg)
          <input
            value={ogImage}
            onChange={(e) => setOgImage(e.target.value)}
            placeholder="https://... वा /og.jpg"
            className={field}
          />
        </label>
        {ogImage.trim() ? (
          <img src={ogImage.startsWith("http") || ogImage.startsWith("/") ? ogImage : "/og.jpg"} alt="" className="max-h-40 w-full rounded-xl border border-line object-cover" />
        ) : null}
        <label className="text-sm font-medium">
          क्यानोनिकल URL
          <input
            value={canonicalUrl}
            onChange={(e) => setCanonicalUrl(e.target.value)}
            placeholder="https://www.kalaiyaonline.com"
            className={field}
          />
        </label>
        <label className="text-sm font-medium">
          Google Search Console प्रमाणीकरण
          <input
            value={googleVerify}
            onChange={(e) => setGoogleVerify(e.target.value)}
            placeholder="google-site-verification कोड"
            className={field}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Robots
            <select value={robots} onChange={(e) => setRobots(e.target.value)} className={field}>
              <option value="index,follow">index, follow</option>
              <option value="index,nofollow">index, nofollow</option>
              <option value="noindex,follow">noindex, follow</option>
              <option value="noindex,nofollow">noindex, nofollow</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            X / Twitter हैंडल
            <input
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="kalaiyaonline"
              className={field}
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-1 inline-flex min-h-11 w-fit items-center rounded-md bg-crimson px-4 text-sm font-semibold text-paper disabled:opacity-60"
        >
          {saving ? "सेभ हुँदै…" : "SEO सेभ गर्नुहोस्"}
        </button>
      </form>
    </section>
  );
}
