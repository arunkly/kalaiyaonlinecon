import { Link, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdSlot } from "@/components/ad-slot";
import {
  listGalleryCategories,
  listGalleryPosts,
  type GalleryCategory,
  type GalleryPhoto,
  type GalleryPost,
} from "@/lib/gallery-desk";

export const Route = createFileRoute("/gallery")({ component: GalleryLayout });

function GalleryLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isIndex = pathname === "/gallery" || pathname === "/gallery/";
  return (
    <>
      {isIndex ? <GalleryPage /> : null}
      <Outlet />
    </>
  );
}

function albumPhotos(post: GalleryPost): GalleryPhoto[] {
  const photos = [...post.photos];
  if (post.coverUrl && !photos.some((p) => p.imageUrl === post.coverUrl)) {
    photos.unshift({ id: 0, imageUrl: post.coverUrl, caption: post.title });
  }
  return photos;
}

function GalleryPage() {
  const [cats, setCats] = useState<GalleryCategory[]>([]);
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    void Promise.all([listGalleryCategories(), listGalleryPosts()]).then(([c, p]) => {
      setCats(c);
      setPosts(p);
    });
  }, []);

  const visible = filter === "all" ? posts : posts.filter((p) => p.category === filter);

  return (
    <div>
      <p className="kicker">तस्बिर</p>
      <h1 className="mt-2 font-display text-4xl font-bold">ग्यालरी</h1>
      <AdSlot slot="gallery" className="mt-4" />
      <p className="mt-2 max-w-xl text-sm text-muted">
        मन्दिर, मेला, विद्यालय र कलैयाका फ्रेमहरू। तस्बिरमा थिचेर ठूलो हेर्नुहोस्।
      </p>
      {cats.length ? (
        <div className="mt-5 flex gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm ${
              filter === "all" ? "border-crimson bg-chip text-crimson" : "border-line bg-surface"
            }`}
          >
            सबै
          </button>
          {cats.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setFilter(c.slug)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm ${
                filter === c.slug ? "border-crimson bg-chip text-crimson" : "border-line bg-surface"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.length === 0 ? (
          <p className="col-span-full rounded-2xl border border-dashed border-line-strong bg-surface px-5 py-12 text-center text-muted">
            ग्यालरी अहिले खाली छ।
          </p>
        ) : (
          visible.map((item) => {
            const photos = albumPhotos(item);
            const cover = photos[0]?.imageUrl;
            return (
              <article
                key={item.id}
                className="card-lift overflow-hidden rounded-2xl border border-line bg-surface"
              >
                <Link to="/gallery/$slug" params={{ slug: item.slug }} className="block text-left">
                  {cover ? (
                    <img src={cover} alt={item.title} className="h-48 w-full object-cover" />
                  ) : (
                    <div className="flex h-40 items-end bg-gradient-to-br from-crimson to-crimson-deep px-4 py-3 text-paper">
                      <p className="font-display text-lg">{item.title}</p>
                    </div>
                  )}
                  <div className="px-4 py-3">
                    <p className="font-display text-lg leading-snug">{item.title}</p>
                    <p className="text-xs font-semibold tracking-wider text-muted">{item.place}</p>
                    {item.blurb ? <p className="mt-1 text-sm text-ink-soft">{item.blurb}</p> : null}
                    <p className="mt-2 text-xs text-crimson">{photos.length} तस्बिर · खोल्नुहोस्</p>
                  </div>
                </Link>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
