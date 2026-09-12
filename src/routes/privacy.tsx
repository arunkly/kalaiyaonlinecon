import { Link, createFileRoute } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { getMyAccess } from "@/lib/admin-access";
import { getPrivacyDoc, savePrivacyPage, type PrivacyDoc } from "@/lib/privacy";

export const Route = createFileRoute("/privacy")({ component: PrivacyPage });

function PrivacyPage() {
  const [doc, setDoc] = useState<PrivacyDoc | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [editing, setEditing] = useState(false);
  const [intro, setIntro] = useState("");
  const [extra, setExtra] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  function load() {
    setFailed(false);
    void getPrivacyDoc()
      .then((next) => {
        setDoc(next);
        setIntro(next.customIntro);
        setExtra(next.extra);
      })
      .catch(() => setFailed(true));
  }

  useEffect(() => {
    load();
    void getMyAccess()
      .then((row) => setCanEdit(Boolean(row.caps.settings)))
      .catch(() => setCanEdit(false));
  }, []);

  if (!doc) {
    return (
      <article className="mx-auto max-w-3xl space-y-6 text-base leading-relaxed text-ink-soft">
        <p className="kicker">कानुन</p>
        <h1 className="font-display text-4xl font-normal text-ink">गोपनीयता नीति</h1>
        <p className="text-sm text-muted">{failed ? "नीति लोड भएन।" : "लोड हुँदै…"}</p>
        {failed ? (
          <button type="button" className="text-sm font-semibold text-crimson" onClick={load}>
            फेरि प्रयास
          </button>
        ) : null}
      </article>
    );
  }

  return (
    <article className="mx-auto max-w-3xl space-y-6 text-base leading-relaxed text-ink-soft">
      <p className="kicker">कानुन</p>
      <h1 className="font-display text-4xl font-normal text-ink">गोपनीयता नीति</h1>
      <p className="text-sm text-muted">अन्तिम अद्यावधिक: {doc.updatedLabel}</p>
      {canEdit ? (
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-crimson px-3 py-1.5 text-sm font-semibold text-crimson"
          onClick={() => {
            setError(null);
            setEditing((v) => !v);
          }}
        >
          <Pencil className="size-4" />
          {editing ? "पूर्वावलोकन" : "सम्पादन"}
        </button>
      ) : null}

      {editing && canEdit ? (
        <form
          className="space-y-5 rounded-[1.4rem] border border-line bg-surface p-5"
          onSubmit={(e) => {
            e.preventDefault();
            setSaving(true);
            setError(null);
            void savePrivacyPage({ data: { intro, extra } })
              .then((next) => {
                setDoc(next);
                setIntro(next.customIntro);
                setExtra(next.extra);
                setEditing(false);
              })
              .catch((err) => setError(err instanceof Error ? err.message : "सेभ भएन।"))
              .finally(() => setSaving(false));
          }}
        >
          <p className="text-sm text-muted">
            नाम, डोमेन ({doc.host}) र खुला मोड्युल ({doc.services.join(", ")}) अनुसार मुख्य नीति
            आफैं लेखिन्छ। यहाँबाट परिचय र अतिरिक्त दफा मात्र सम्पादन हुन्छ।
          </p>
          <label className="block text-sm font-medium">
            परिचय (खाली राखे आफैं लेखिन्छ)
            <textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={5}
              maxLength={2000}
              placeholder={doc.autoIntro}
              className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3 outline-none focus:border-crimson"
            />
          </label>
          <label className="block text-sm font-medium">
            अतिरिक्त जानकारी
            <textarea
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              rows={6}
              maxLength={8000}
              placeholder="कानुनी नोट, कुकी विवरण वा अन्य दफा…"
              className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3 outline-none focus:border-crimson"
            />
          </label>
          {error ? <p className="text-sm text-mark">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 items-center rounded-full bg-crimson px-5 text-sm font-semibold text-paper disabled:opacity-60"
            >
              {saving ? "सेभ हुँदै…" : "सेभ गर्नुहोस्"}
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm font-semibold"
              onClick={() => {
                setIntro("");
                setExtra(doc.extra);
              }}
            >
              स्वतः परिचय
            </button>
          </div>
        </form>
      ) : (
        <>
          <p>{doc.intro}</p>
          {doc.sections.map((section) => (
            <section key={section.id} className="space-y-2">
              <h2 className="font-display text-2xl text-ink">{section.title}</h2>
              {section.bullets?.length ? (
                <ul className="list-disc space-y-1 pl-5">
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
              {section.paragraphs?.map((p) =>
                section.id === "extra" ? (
                  <p key={p.slice(0, 24)} className="whitespace-pre-wrap">
                    {p}
                  </p>
                ) : (
                  <p key={p.slice(0, 24)}>{p}</p>
                ),
              )}
              {section.id === "contact" ? (
                <p>
                  <Link to="/about" className="text-crimson hover:underline">
                    हाम्रोबारे
                  </Link>
                  {doc.contact.email ? (
                    <>
                      {" · "}
                      <a className="text-crimson hover:underline" href={`mailto:${doc.contact.email}`}>
                        {doc.contact.email}
                      </a>
                    </>
                  ) : null}
                </p>
              ) : null}
            </section>
          ))}
        </>
      )}
    </article>
  );
}
