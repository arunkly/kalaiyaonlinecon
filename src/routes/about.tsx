import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getMyAccess } from "@/lib/admin-access";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { DEFAULT_ABOUT, getAboutPage, saveAboutPage, type AboutPage } from "@/lib/about";
import { ContactForm } from "@/components/contact-form";
import { AppLogo } from "@/components/app-logo";

export const Route = createFileRoute("/about")({ component: AboutPageView });

function siteHost(url: string) {
  return String(url || "").replace(/^https?:\/\//, "");
}

function AboutPageView() {
  const { user } = useCurrentUserState();
  const [admin, setAdmin] = useState(false);
  const [page, setPage] = useState<AboutPage>(DEFAULT_ABOUT);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getAboutPage()
      .then((next) => setPage(next ?? DEFAULT_ABOUT))
      .catch(() => setPage(DEFAULT_ABOUT));
    void getMyAccess()
      .then((row) => setAdmin(row.admin))
      .catch(() => setAdmin(false));
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <AppLogo className="mb-5 h-10 w-auto" />
      <p className="text-[11px] font-semibold tracking-[0.22em] text-crimson">KalaiyaOnline.Com</p>
      <h1 className="mt-2 font-display text-4xl font-normal">{page.title || "हाम्रोबारे"}</h1>
      {admin ? (
        <button
          type="button"
          className="mt-3 text-sm font-semibold text-crimson"
          onClick={() => setEditing((v) => !v)}
        >
          {editing ? "पूर्वावलोकन" : "पेज सम्पादन"}
        </button>
      ) : null}

      {editing && admin ? (
        <form
          className="mt-6 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            void saveAboutPage({ data: page })
              .then(() => setEditing(false))
              .catch((err) => setError(err instanceof Error ? err.message : "सेभ भएन।"));
          }}
        >
          <section className="space-y-3 rounded-2xl border border-line bg-surface p-4">
            <p className="text-[11px] font-bold tracking-[0.16em] text-muted">पेज</p>
            <input
              value={page.title}
              onChange={(e) => setPage({ ...page, title: e.target.value })}
              placeholder="शीर्षक"
              className="w-full rounded-xl border border-line bg-paper px-3 py-3"
            />
            <textarea
              value={page.body}
              onChange={(e) => setPage({ ...page, body: e.target.value })}
              rows={6}
              className="w-full rounded-xl border border-line bg-paper px-3 py-3"
            />
          </section>
          <section className="space-y-3 rounded-2xl border border-line bg-surface p-4">
            <p className="text-[11px] font-bold tracking-[0.16em] text-muted">सम्पर्क</p>
            <input value={page.phone} onChange={(e) => setPage({ ...page, phone: e.target.value })} placeholder="फोन" className="w-full rounded-xl border border-line bg-paper px-3 py-3" />
            <input value={page.email} onChange={(e) => setPage({ ...page, email: e.target.value })} placeholder="इमेल" className="w-full rounded-xl border border-line bg-paper px-3 py-3" />
            <input value={page.address} onChange={(e) => setPage({ ...page, address: e.target.value })} placeholder="ठेगाना" className="w-full rounded-xl border border-line bg-paper px-3 py-3" />
            <input value={page.facebook} onChange={(e) => setPage({ ...page, facebook: e.target.value })} placeholder="फेसबुक लिंक" className="w-full rounded-xl border border-line bg-paper px-3 py-3" />
            <input value={page.website} onChange={(e) => setPage({ ...page, website: e.target.value })} placeholder="वेबसाइट" className="w-full rounded-xl border border-line bg-paper px-3 py-3" />
          </section>
          <section className="space-y-3 rounded-2xl border border-line bg-surface p-4">
            <p className="text-[11px] font-bold tracking-[0.16em] text-muted">फुटर / दर्ता</p>
            <input value={page.orgName} onChange={(e) => setPage({ ...page, orgName: e.target.value })} placeholder="संस्थाको नाम" className="w-full rounded-xl border border-line bg-paper px-3 py-3" />
            <input value={page.registrationNo} onChange={(e) => setPage({ ...page, registrationNo: e.target.value })} placeholder="सरकारी दर्ता नम्बर" className="w-full rounded-xl border border-line bg-paper px-3 py-3" />
            <textarea value={page.extraNote} onChange={(e) => setPage({ ...page, extraNote: e.target.value })} placeholder="प्यान, कार्यालय वा अन्य दर्ता विवरण" rows={3} className="w-full rounded-xl border border-line bg-paper px-3 py-3" />
          </section>
          {error ? <p className="text-sm text-mark">{error}</p> : null}
          <button className="rounded-full bg-crimson px-4 py-2 text-sm font-semibold text-paper">सेभ</button>
        </form>
      ) : (
        <>
          <div className="mt-6 space-y-4 whitespace-pre-wrap text-base leading-relaxed text-ink-soft">
            {page.body}
          </div>
          <dl className="mt-8 grid gap-4 text-sm">
            {page.address ? (
              <div className="rounded-md border border-line bg-surface px-4 py-3">
                <dt className="text-muted">ठेगाना</dt>
                <dd>{page.address}</dd>
              </div>
            ) : null}
            {page.phone ? (
              <div className="rounded-md border border-line bg-surface px-4 py-3">
                <dt className="text-muted">फोन</dt>
                <dd>
                  <a className="text-crimson" href={`tel:${page.phone}`}>
                    {page.phone}
                  </a>
                </dd>
              </div>
            ) : null}
            {page.email ? (
              <div className="rounded-md border border-line bg-surface px-4 py-3">
                <dt className="text-muted">इमेल</dt>
                <dd>
                  <a className="text-crimson" href={`mailto:${page.email}`}>
                    {page.email}
                  </a>
                </dd>
              </div>
            ) : null}
            {page.website ? (
              <div className="rounded-md border border-line bg-surface px-4 py-3">
                <dt className="text-muted">साइट</dt>
                <dd>
                  <a className="text-crimson hover:underline" href={String(page.website)}>
                    {siteHost(page.website)}
                  </a>
                </dd>
              </div>
            ) : null}
            {page.facebook ? (
              <div className="rounded-md border border-line bg-surface px-4 py-3">
                <dt className="text-muted">फेसबुक</dt>
                <dd>
                  <a className="text-crimson hover:underline" href={String(page.facebook)}>
                    फेसबुक पेज
                  </a>
                </dd>
              </div>
            ) : null}
            {page.registrationNo ? (
              <div className="rounded-md border border-line bg-surface px-4 py-3">
                <dt className="text-muted">सरकारी दर्ता</dt>
                <dd>{page.registrationNo}</dd>
              </div>
            ) : null}
            {page.extraNote ? (
              <div className="rounded-md border border-line bg-surface px-4 py-3">
                <dt className="text-muted">अन्य विवरण</dt>
                <dd className="whitespace-pre-wrap">{page.extraNote}</dd>
              </div>
            ) : null}
          </dl>
          <ContactForm />
        </>
      )}
    </div>
  );
}
