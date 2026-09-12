import { AdsDeskPanel } from "@/components/admin-ads-desk";
import { SiteDeskPanel } from "@/components/admin-site-desk";
import { SeoDeskPanel } from "@/components/admin-seo-desk";
import { SettingsDeskPanel } from "@/components/admin-settings-desk";
import { FeaturesDeskPanel } from "@/components/admin-features-desk";
import { ElectionDeskPanel } from "@/components/admin-election-desk";
import { ThemeDeskPanel } from "@/components/admin-theme-desk";
import { ContactDeskPanel } from "@/components/admin-contact-desk";
import { BloodDeskPanel } from "@/components/admin-blood-desk";
import { DirectoryDeskPanel } from "@/components/admin-directory-desk";
import { GalleryDeskPanel } from "@/components/admin-gallery-desk";
import { EpaperDeskPanel } from "@/components/admin-epaper-desk";
import { UsersDeskPanel } from "@/components/admin-users-desk";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { parseCategories } from "@/data/articles";
import { formatBsDateTime } from "@/lib/bs-date";
import { getMyAccess, type Cap, type StaffAccess } from "@/lib/admin-access";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/cn";
import { storyPublishIso, splitGalleryBody } from "@/lib/edition";
import {
  createCategory,
  createStory,
  deleteCategory,
  listAdminStories,
  listCategories,
  listTrashStories,
  purgeStory,
  restoreStory,
  trashStory,
  updateCategory,
  updateStory,
  type DeskCategory,
  type DeskStory,
} from "@/lib/desk";

export const Route = createFileRoute("/admin")({ component: AdminPage });

function defaultCategory(cats: DeskCategory[]) {
  return cats.find((c) => c.slug === "local")?.slug
    || cats.find((c) => c.slug !== "headline")?.slug
    || cats[0]?.slug
    || "local";
}

type Desk = "news" | "gallery" | "directory" | "blood" | "election" | "epaper" | "users" | "ads" | "contact" | "site" | "seo" | "theme" | "modules" | "settings";
type Tab = "posts" | "categories" | "trash";

const DESKS: { id: Desk; label: string; cap: Cap }[] = [
  { id: "news", label: "समाचार डेस्क", cap: "news" },
  { id: "gallery", label: "ग्यालरी डेस्क", cap: "gallery" },
  { id: "directory", label: "डाइरेक्ट्री डेस्क", cap: "directory" },
  { id: "blood", label: "रक्तदाता डेस्क", cap: "blood" },
  { id: "election", label: "निर्वाचन डेस्क", cap: "election" },
  { id: "epaper", label: "ई-पेपर डेस्क", cap: "epaper" },
  { id: "users", label: "प्रयोगकर्ता", cap: "users" },
  { id: "ads", label: "विज्ञापन डेस्क", cap: "settings" },
  { id: "contact", label: "सम्पर्क सन्देश", cap: "settings" },
  { id: "site", label: "साइट", cap: "settings" },
  { id: "seo", label: "SEO", cap: "settings" },
  { id: "theme", label: "रूप / लोगो", cap: "settings" },
  { id: "modules", label: "मोड्युल", cap: "settings" },
  { id: "settings", label: "सेटिङ", cap: "settings" },
];

const field =
  "mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3 outline-none focus:border-crimson";

function AdminPage() {
  const { user, isPending } = useCurrentUserState();
  const [allowed, setAllowed] = useState(false);
  const [access, setAccess] = useState<StaffAccess | null>(null);
  const [desk, setDesk] = useState<Desk>("news");
  const [tab, setTab] = useState<Tab>("posts");
  const [stories, setStories] = useState<DeskStory[] | null>(null);
  const [trash, setTrash] = useState<DeskStory[] | null>(null);
  const [cats, setCats] = useState<DeskCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [okNotice, setOkNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("local");
  const [selectedCats, setSelectedCats] = useState<string[]>(["local"]);
  const [location, setLocation] = useState("कलैया, बारा");
  const [tags, setTags] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [catLabel, setCatLabel] = useState("");
  const [editCatId, setEditCatId] = useState<number | null>(null);

  async function refresh() {
    try {
      const [live, bin, sections] = await Promise.all([
        listAdminStories(),
        listTrashStories(),
        listCategories(),
      ]);
      setStories(live);
      setTrash(bin);
      setCats(sections);
      if (!sections.some((c) => c.slug === category)) {
        setCategory(defaultCategory(sections));
        setSelectedCats([defaultCategory(sections)]);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "डेस्क लोड भएन।");
    }
  }

  useEffect(() => {
    if (!user) {
      setAllowed(false);
      return;
    }
    void getMyAccess()
      .then((row) => {
        setAllowed(row.admin);
        setAccess(row);
        const first = DESKS.find((d) => row.caps[d.cap]);
        if (first) setDesk(first.id);
      })
      .catch(() => setAllowed(false));
  }, [user?.id]);

  useEffect(() => {
    if (!isPending && user && allowed && access?.caps.news) {
      void refresh();
    }
  }, [isPending, user, allowed, access?.caps.news]);

  if (isPending) {
    return <div className="h-40 animate-pulse rounded-md bg-chip" />;
  }
  if (!user) return <RedirectToSignIn />;

  if (!allowed) {
    return (
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-4xl">डेस्क बन्द</h1>
        <p className="mt-3 text-sm text-muted">
          यो खाताले पत्रिका पढ्न सक्छ तर समाचार दाखिला गर्न सक्दैन। सम्पादक
          खाताले लगइन गर्नुहोस्।
        </p>
        <div className="mt-6">
          <UserButton />
        </div>
      </div>
    );
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setExcerpt("");
    setBody("");
    setTags("");
    setImageUrl("");
    setLocation("कलैया, बारा");
    setCategory(defaultCategory(cats));
    setSelectedCats([defaultCategory(cats)]);
  }

  function startEdit(s: DeskStory) {
    setTab("posts");
    setEditingId(s.id);
    setTitle(s.title);
    setExcerpt(s.excerpt);
    setBody(splitGalleryBody(s.body).body);
    setCategory(s.category);
    setSelectedCats(parseCategories(s.category, s.categories));
    setLocation(s.location);
    setTags(s.tags);
    setImageUrl(s.imageUrl ?? "");
  }

  async function onSaveStory(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setOkNotice(null);
    try {
      if (editingId) {
        await updateStory({
          data: {
            id: editingId,
            title,
            excerpt,
            body,
            category: selectedCats[0] || category,
            categories: selectedCats.join(","),
            tags,
            imageUrl,
            location: location.trim() || "कलैया, बारा",
          },
        });
      } else {
        await createStory({
          data: {
            title,
            excerpt,
            body,
            category: selectedCats[0] || category,
            categories: selectedCats.join(","),
            tags,
            imageUrl,
            location: location.trim() || "कलैया, बारा",
          },
        });
      }
      const saved = editingId ? "समाचार अद्यावधिक भयो।" : "समाचार प्रकाशित भयो।";
      resetForm();
      try {
        await refresh();
      } catch {
        /* already saved */
      }
      setError(null);
      setOkNotice(saved);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "समाचार सेभ भएन।";
      setError(
        msg === "Unauthorized"
          ? "सत्र सकियो। फेरि लगइन गर्नुहोस्।"
          : msg,
      );
    } finally {
      setSaving(false);
    }
  }

  async function onTrash(id: number) {
    setError(null);
    try {
      await trashStory({ data: { id } });
      if (editingId === id) resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ट्र्यासमा पठाउन सकिएन।");
    }
  }

  async function onRestore(id: number) {
    setError(null);
    try {
      await restoreStory({ data: { id } });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "फिर्ता ल्याउन सकिएन।");
    }
  }

  async function onPurge(id: number) {
    setError(null);
    try {
      await purgeStory({ data: { id } });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "मेटाउन सकिएन।");
    }
  }

  async function onSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editCatId) {
        await updateCategory({ data: { id: editCatId, label: catLabel } });
      } else {
        await createCategory({ data: { label: catLabel } });
      }
      setCatLabel("");
      setEditCatId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "विभाग सेभ भएन।");
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteCategory(id: number) {
    setError(null);
    try {
      await deleteCategory({ data: { id } });
      if (editCatId === id) {
        setEditCatId(null);
        setCatLabel("");
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "विभाग मेट्न सकिएन।");
    }
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "posts", label: "समाचार", count: stories?.length },
    ...(access?.caps.newsDelete
      ? [
          { id: "categories" as const, label: "विभाग", count: cats.length },
          { id: "trash" as const, label: "ट्र्यास", count: trash?.length },
        ]
      : []),
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.22em] text-crimson">
            सम्पादक
          </p>
          <h1 className="mt-1 font-display text-4xl">प्रशासन डेस्क</h1>
          <p className="mt-1 text-sm text-muted">{user.primaryEmail}</p>
        </div>
        <UserButton />
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {DESKS.filter((item) => access?.caps[item.cap]).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setDesk(item.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold",
              desk === item.id ? "bg-crimson text-paper" : "border border-line bg-surface text-ink-soft",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {desk === "gallery" && access?.caps.gallery ? <GalleryDeskPanel /> : null}
      {desk === "directory" && access?.caps.directory ? <DirectoryDeskPanel /> : null}
      {desk === "blood" && access?.caps.blood ? <BloodDeskPanel /> : null}
      {desk === "election" && access?.caps.election ? <ElectionDeskPanel /> : null}
      {desk === "epaper" && access?.caps.epaper ? <EpaperDeskPanel /> : null}
      {desk === "users" && access?.caps.users ? <UsersDeskPanel /> : null}
      {desk === "ads" && access?.caps.settings ? <AdsDeskPanel /> : null}
      {desk === "contact" && access?.caps.settings ? <ContactDeskPanel /> : null}
      {desk === "site" && access?.caps.settings ? <SiteDeskPanel /> : null}
      {desk === "seo" && access?.caps.settings ? <SeoDeskPanel /> : null}
      {desk === "theme" && access?.caps.settings ? <ThemeDeskPanel /> : null}
      {desk === "modules" && access?.caps.settings ? <FeaturesDeskPanel /> : null}
      {desk === "settings" && access?.caps.settings ? <SettingsDeskPanel /> : null}
      {desk === "news" && access?.caps.news ? (
        <>
      <div className="flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 px-4 py-3 text-sm font-semibold",
              tab === t.id ? "border-b-2 border-crimson text-crimson" : "text-muted",
            )}
          >
            {t.label}
            {typeof t.count === "number" ? ` (${t.count})` : ""}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-mark">{error}</p> : null}
      {okNotice ? <p className="text-sm font-semibold text-[#2E7D32]">{okNotice}</p> : null}

      {tab === "posts" ? (
        <>
          <form onSubmit={onSaveStory} className="space-y-3 rounded-md border border-line bg-surface p-4 sm:p-6">
            <h2 className="font-display text-2xl">
              {editingId ? "समाचार सम्पादन" : "नयाँ समाचार"}
            </h2>
            <label className="block text-sm font-medium">
              शीर्षक
              <input value={title} onChange={(e) => setTitle(e.target.value)} required className={field} />
            </label>
            <label className="block text-sm font-medium">
              सारांश
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                required
                minLength={4}
                rows={3}
                placeholder="छोटो सारांश लेख्नुहोस्"
                className={field}
              />
            </label>
            <label className="block text-sm font-medium">
              फिचर्ड तस्बिर (बाह्य लिंक)
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className={field}
              />
            </label>
            {imageUrl.trim() ? (
              <img
                src={imageUrl}
                alt=""
                className="max-h-48 w-full rounded-md border border-line object-cover"
              />
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <fieldset className="block text-sm font-medium">
                <legend>विभाग (एकभन्दा बढी छान्न सकिन्छ)</legend>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {cats.map((c) => {
                    const on = selectedCats.includes(c.slug);
                    return (
                      <label
                        key={c.slug}
                        className={
                          on
                            ? "flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-crimson bg-chip px-3 text-sm font-semibold text-crimson"
                            : "flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-line bg-paper px-3 text-sm"
                        }
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => {
                            setSelectedCats((prev) => {
                              const next = on ? prev.filter((slug) => slug !== c.slug) : [...prev, c.slug];
                              return next.length ? next : prev;
                            });
                          }}
                          className="size-4 accent-[#14934e]"
                        />
                        {c.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <label className="block text-sm font-medium">
                स्थान
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  className={field}
                />
              </label>
            </div>
            <label className="block text-sm font-medium">
              विवरण
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                rows={8}
                className={field}
              />
            </label>
            <label className="block text-sm font-medium">
              ट्याग
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="बारा, कलैया"
                className={field}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-11 items-center rounded-md bg-crimson px-4 text-sm font-semibold text-paper disabled:opacity-60"
              >
                {saving ? "सेभ हुँदै…" : editingId ? "अद्यावधिक गर्नुहोस्" : "प्रकाशन गर्नुहोस्"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex min-h-11 items-center rounded-md border border-line px-4 text-sm"
                >
                  रद्द
                </button>
              ) : null}
            </div>
          </form>

          <section>
            <h2 className="border-b border-ink pb-2 font-display text-2xl">प्रकाशित समाचार</h2>
            {stories === null ? (
              <p className="mt-4 text-sm text-muted">लोड हुँदै…</p>
            ) : stories.length === 0 ? (
              <p className="mt-4 text-sm text-muted">अहिले केही छैन।</p>
            ) : (
              <ul className="mt-4 divide-y divide-line rounded-md border border-line bg-surface">
                {[...stories]
                  .sort((a, b) => storyPublishIso(b).localeCompare(storyPublishIso(a)))
                  .map((s) => (
                  <li key={s.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-4">
                    <div className="flex min-w-0 flex-1 gap-3">
                      {s.imageUrl ? (
                        <img
                          src={s.imageUrl}
                          alt=""
                          className="size-16 shrink-0 rounded-md object-cover"
                        />
                      ) : null}
                      <div>
                      <p className="font-display text-xl">{s.title}</p>
                      <p className="text-sm text-muted">
                        {parseCategories(s.category, s.categories)
                          .map((slug) => cats.find((c) => c.slug === slug)?.label ?? slug)
                          .join(" · ")}
                        {" · "}
                        {formatBsDateTime(storyPublishIso(s))}
                      </p>
                      <Link
                        to="/article/$slug"
                        params={{ slug: s.slug }}
                        className="text-sm text-crimson hover:underline"
                      >
                        खोल्नुहोस्
                      </Link>
                    </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(s)}
                        className="min-h-11 rounded-md border border-line px-3 text-sm hover:border-crimson"
                      >
                        सम्पादन
                      </button>
                      {access?.caps.newsDelete ? (
                      <button
                        type="button"
                        onClick={() => void onTrash(s.id)}
                        className="min-h-11 rounded-md border border-line px-3 text-sm hover:border-mark hover:text-mark"
                      >
                        ट्र्यास
                      </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}

      {tab === "categories" ? (
        <section className="space-y-4">
          <form
            onSubmit={onSaveCategory}
            className="flex flex-col gap-3 rounded-md border border-line bg-surface p-4 sm:flex-row sm:items-end"
          >
            <label className="block min-w-0 flex-1 text-sm font-medium">
              {editCatId ? "विभाग सम्पादन" : "नयाँ विभाग"}
              <input
                value={catLabel}
                onChange={(e) => setCatLabel(e.target.value)}
                required
                placeholder="उदाहरण: शिक्षा"
                className={field}
              />
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-11 items-center rounded-md bg-crimson px-4 text-sm font-semibold text-paper disabled:opacity-60"
              >
                {editCatId ? "अद्यावधिक" : "थप्नुहोस्"}
              </button>
              {editCatId ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditCatId(null);
                    setCatLabel("");
                  }}
                  className="inline-flex min-h-11 items-center rounded-md border border-line px-4 text-sm"
                >
                  रद्द
                </button>
              ) : null}
            </div>
          </form>
          <ul className="divide-y divide-line rounded-md border border-line bg-surface">
            {cats.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <p className="font-medium">{c.label}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditCatId(c.id);
                      setCatLabel(c.label);
                    }}
                    className="min-h-11 rounded-md border border-line px-3 text-sm hover:border-crimson"
                  >
                    सम्पादन
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDeleteCategory(c.id)}
                    className="min-h-11 rounded-md border border-line px-3 text-sm hover:border-mark hover:text-mark"
                  >
                    मेट्नुहोस्
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "trash" ? (
        <section>
          <h2 className="border-b border-ink pb-2 font-display text-2xl">ट्र्यास</h2>
          <p className="mt-2 text-sm text-muted">
            मेटिएका समाचार यहाँ रहन्छन्। फिर्ता ल्याउन सकिन्छ।
          </p>
          {trash === null ? (
            <p className="mt-4 text-sm text-muted">लोड हुँदै…</p>
          ) : trash.length === 0 ? (
            <p className="mt-4 text-sm text-muted">ट्र्यास खाली छ।</p>
          ) : (
            <ul className="mt-4 divide-y divide-line rounded-md border border-line bg-surface">
              {trash.map((s) => (
                <li key={s.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-4">
                  <div>
                    <p className="font-display text-xl">{s.title}</p>
                    <p className="text-sm text-muted">
                      {cats.find((c) => c.slug === s.category)?.label ?? s.category} · {s.location}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void onRestore(s.id)}
                      className="min-h-11 rounded-md bg-crimson px-3 text-sm font-semibold text-paper"
                    >
                      फिर्ता ल्याउनुहोस्
                    </button>
                    <button
                      type="button"
                      onClick={() => void onPurge(s.id)}
                      className="min-h-11 rounded-md border border-line px-3 text-sm hover:border-mark hover:text-mark"
                    >
                      सधैं मेट्नुहोस्
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
        </>
      ) : null}
    </div>
  );
}
