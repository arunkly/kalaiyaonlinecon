import { useEffect, useState } from "react";
import {
  addGalleryPhoto,
  createGalleryCategory,
  createGalleryPost,
  deleteGalleryCategory,
  deleteGalleryPhoto,
  deleteGalleryPost,
  listGalleryCategories,
  listGalleryPosts,
  updateGalleryPost,
  type GalleryCategory,
  type GalleryPost,
} from "@/lib/gallery-desk";

const field =
  "mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3 outline-none focus:border-crimson";

export function GalleryDeskPanel() {
  const [cats, setCats] = useState<GalleryCategory[]>([]);
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [catLabel, setCatLabel] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState("कलैया");
  const [blurb, setBlurb] = useState("");
  const [category, setCategory] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [activePost, setActivePost] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const [sections, albums] = await Promise.all([listGalleryCategories(), listGalleryPosts()]);
    setCats(sections);
    setPosts(albums);
    if (sections[0] && !category) setCategory(sections[0].slug);
  }

  useEffect(() => {
    void refresh().catch((err) => setError(String(err)));
  }, []);

  function reset() {
    setEditingId(null);
    setTitle("");
    setPlace("कलैया");
    setBlurb("");
    setCoverUrl("");
  }

  async function onSavePost(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (editingId) {
        await updateGalleryPost({
          data: { id: editingId, title, place, blurb, category, coverUrl },
        });
      } else {
        await createGalleryPost({ data: { title, place, blurb, category, coverUrl } });
      }
      reset();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "पोस्ट सेभ भएन।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-mark">{error}</p> : null}
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-display text-2xl">ग्यालरी विभाग</h2>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void createGalleryCategory({ data: { label: catLabel } })
              .then(() => {
                setCatLabel("");
                return refresh();
              })
              .catch((err) => setError(err instanceof Error ? err.message : "विभाग बनेन।"));
          }}
        >
          <input
            value={catLabel}
            onChange={(e) => setCatLabel(e.target.value)}
            required
            placeholder="जस्तै: मेला"
            className={field + " mt-0"}
          />
          <button className="shrink-0 rounded-full bg-crimson px-4 text-sm font-semibold text-paper">
            थप्नुहोस्
          </button>
        </form>
        <ul className="mt-3 flex flex-wrap gap-2">
          {cats.map((c) => (
            <li key={c.id} className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-sm">
              {c.label}
              <button
                type="button"
                className="text-mark"
                onClick={() => void deleteGalleryCategory({ data: { id: c.id } }).then(refresh)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </section>

      <form onSubmit={onSavePost} className="space-y-3 rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-display text-2xl">{editingId ? "ग्यालरी सम्पादन" : "नयाँ ग्यालरी पोस्ट"}</h2>
        <label className="block text-sm font-medium">
          शीर्षक
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className={field} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            स्थान
            <input value={place} onChange={(e) => setPlace(e.target.value)} required className={field} />
          </label>
          <label className="block text-sm font-medium">
            विभाग
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
              {cats.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-sm font-medium">
          विवरण
          <textarea value={blurb} onChange={(e) => setBlurb(e.target.value)} rows={3} className={field} />
        </label>
        <label className="block text-sm font-medium">
          कभर तस्बिर (बाह्य लिंक)
          <input
            type="url"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://"
            className={field}
          />
        </label>
        {coverUrl ? <img src={coverUrl} alt="" className="max-h-40 rounded-xl object-cover" /> : null}
        <div className="flex gap-2">
          <button
            disabled={busy || !cats.length}
            className="rounded-full bg-crimson px-4 py-2 text-sm font-semibold text-paper disabled:opacity-60"
          >
            {editingId ? "अपडेट" : "पोस्ट बनाउनुहोस्"}
          </button>
          {editingId ? (
            <button type="button" onClick={reset} className="text-sm text-muted">
              रद्द
            </button>
          ) : null}
        </div>
      </form>

      <section className="space-y-4">
        {posts.map((p) => (
          <article key={p.id} className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-display text-xl">{p.title}</h3>
                <p className="text-xs text-muted">
                  {p.place} · {p.category}
                </p>
              </div>
              <div className="flex gap-2 text-sm">
                <button
                  type="button"
                  className="text-crimson"
                  onClick={() => {
                    setEditingId(p.id);
                    setTitle(p.title);
                    setPlace(p.place);
                    setBlurb(p.blurb);
                    setCategory(p.category);
                    setCoverUrl(p.coverUrl);
                  }}
                >
                  सम्पादन
                </button>
                <button
                  type="button"
                  className="text-mark"
                  onClick={() => void deleteGalleryPost({ data: { id: p.id } }).then(refresh)}
                >
                  मेट्नुहोस्
                </button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {p.photos.map((ph) => (
                <div key={ph.id} className="relative">
                  <img src={ph.imageUrl} alt={ph.caption} className="h-20 w-full rounded-lg object-cover" />
                  <button
                    type="button"
                    className="absolute right-1 top-1 rounded bg-ink/70 px-1 text-xs text-paper"
                    onClick={() => void deleteGalleryPhoto({ data: { id: ph.id } }).then(refresh)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {activePost === p.id ? (
              <form
                className="mt-3 flex flex-col gap-2 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  void addGalleryPhoto({
                    data: { postId: p.id, imageUrl: photoUrl, caption },
                  })
                    .then(() => {
                      setPhotoUrl("");
                      setCaption("");
                      return refresh();
                    })
                    .catch((err) => setError(err instanceof Error ? err.message : "तस्बिर थपिएन।"));
                }}
              >
                <input
                  type="url"
                  required
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https:// तस्बिर लिंक"
                  className={field + " mt-0"}
                />
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="क्याप्सन"
                  className={field + " mt-0 sm:max-w-40"}
                />
                <button className="rounded-full bg-crimson px-4 py-2 text-sm font-semibold text-paper">
                  थप्नुहोस्
                </button>
              </form>
            ) : (
              <button
                type="button"
                className="mt-3 text-sm font-semibold text-crimson"
                onClick={() => {
                  setActivePost(p.id);
                  setPhotoUrl("");
                  setCaption("");
                }}
              >
                बाह्य तस्बिर थप्नुहोस्
              </button>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
