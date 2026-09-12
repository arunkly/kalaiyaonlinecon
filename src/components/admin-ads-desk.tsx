import { useEffect, useState } from "react";
import { AD_SLOTS, POPUP_FREQ, createAd, deleteAd, listAds, type AdItem, type AdKind, type PopupFreq } from "@/lib/ads";

const field =
  "mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3 outline-none focus:border-crimson";

export function AdsDeskPanel() {
  const [ads, setAds] = useState<AdItem[]>([]);
  const [slot, setSlot] = useState<string>(AD_SLOTS[0].id);
  const [kind, setKind] = useState<AdKind>("photo");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [html, setHtml] = useState("");
  const [href, setHref] = useState("");
  const [freq, setFreq] = useState<PopupFreq>("session");
  const [delaySec, setDelaySec] = useState(2);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    void listAds().then(setAds);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-mark">{error}</p> : null}
      <form
        className="space-y-3 rounded-2xl border border-line bg-surface p-5"
        onSubmit={(e) => {
          e.preventDefault();
          void createAd({ data: { slot, kind, title, body, imageUrl, html, href, active: true, freq, delaySec } })
            .then(() => {
              setTitle("");
              setBody("");
              setImageUrl("");
              setHtml("");
              setHref("");
              refresh();
            })
            .catch((err) => setError(err instanceof Error ? err.message : "विज्ञापन सेभ भएन।"));
        }}
      >
        <h2 className="font-display text-2xl">नयाँ विज्ञापन</h2>
        {slot === "popup" ? (
          <p className="rounded-xl bg-chip px-3 py-2 text-sm text-ink-soft">
            पपअप साइटको बीचमा देखिन्छ। तलको नियमले कति पटक र कति ढिलो देखाउने तय गर्छ।
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">
            स्थान
            <select value={slot} onChange={(e) => setSlot(e.target.value)} className={field}>
              {AD_SLOTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            प्रकार
            <select value={kind} onChange={(e) => setKind(e.target.value as AdKind)} className={field}>
              <option value="photo">फोटो</option>
              <option value="text">टेक्स्ट</option>
              <option value="html">HTML</option>
            </select>
          </label>
        </div>
        {slot === "popup" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">
              देखाउने नियम
              <select value={freq} onChange={(e) => setFreq(e.target.value as PopupFreq)} className={field}>
                {POPUP_FREQ.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              ढिलाइ (सेकेन्ड)
              <select value={delaySec} onChange={(e) => setDelaySec(Number(e.target.value))} className={field}>
                <option value={0}>तुरुन्त</option>
                <option value={2}>२ सेकेन्ड</option>
                <option value={5}>५ सेकेन्ड</option>
                <option value={8}>८ सेकेन्ड</option>
                <option value={15}>१५ सेकेन्ड</option>
              </select>
            </label>
          </div>
        ) : null}
        <label className="block text-sm font-medium">
          शीर्षक
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
        </label>
        {kind === "photo" ? (
          <label className="block text-sm font-medium">
            तस्बिर लिंक
            <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className={field} />
          </label>
        ) : null}
        {kind === "text" ? (
          <label className="block text-sm font-medium">
            पाठ
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className={field} />
          </label>
        ) : null}
        {kind === "html" ? (
          <label className="block text-sm font-medium">
            HTML
            <textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={5} className={field} />
          </label>
        ) : null}
        <label className="block text-sm font-medium">
          लिंक (वैकल्पिक)
          <input type="url" value={href} onChange={(e) => setHref(e.target.value)} className={field} />
        </label>
        <button className="rounded-full bg-crimson px-4 py-2 text-sm font-semibold text-paper">थप्नुहोस्</button>
      </form>

      <ul className="space-y-3">
        {ads.map((ad) => (
          <li key={ad.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
            <div>
              <p className="text-xs text-muted">
                {AD_SLOTS.find((s) => s.id === ad.slot)?.label ?? ad.slot} · {ad.kind}
                {ad.slot === "popup"
                  ? ` · ${POPUP_FREQ.find((f) => f.id === ad.freq)?.label ?? "सत्र"} · ${ad.delaySec ?? 0}से.`
                  : ""}
              </p>
              <p className="font-semibold">{ad.title || "विज्ञापन"}</p>
            </div>
            <button type="button" className="text-sm text-mark" onClick={() => void deleteAd({ data: { id: ad.id } }).then(refresh)}>
              मेट्नुहोस्
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
