import { Link, createFileRoute } from "@tanstack/react-router";
import { Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { GalleryLightbox } from "@/components/gallery-lightbox";
import { ShareBar } from "@/components/share-bar";
import { toNpDigits } from "@/data/articles";
import { getGalleryPost, type GalleryPhoto, type GalleryPost } from "@/lib/gallery-desk";
import { incrementView } from "@/lib/views";
import { sharePageMeta } from "@/lib/site-url";

export const Route = createFileRoute("/gallery/$slug")({
  loader: ({ params }) => getGalleryPost({ data: { slug: params.slug } }),
  head: ({ loaderData, params }) => {
    const post = loaderData;
    const slug = post?.slug || params.slug;
    return sharePageMeta({
      title: post?.title?.trim() || "KalaiyaOnline",
      description: post?.place || "ग्यालरी",
      path: `/gallery/${encodeURIComponent(slug)}`,
      imagePath: `/share-image/gallery/${encodeURIComponent(slug)}`,
    });
  },
  component: GalleryPostPage,
});

function albumPhotos(post: GalleryPost): GalleryPhoto[] {
  const photos = [...post.photos];
  if (post.coverUrl && !photos.some((p) => p.imageUrl === post.coverUrl)) {
    photos.unshift({ id: 0, imageUrl: post.coverUrl, caption: post.title });
  }
  return photos;
}

function GalleryPostPage() {
  const { slug } = Route.useParams();
  const [post, setPost] = useState<GalleryPost | null>(null);
  const [missing, setMissing] = useState(false);
  const [views, setViews] = useState(0);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    void getGalleryPost({ data: { slug } }).then((row) => {
      setPost(row);
      setMissing(!row);
    });
    void incrementView({ data: { kind: "gallery", key: slug } })
      .then((r) => setViews(r.views))
      .catch(() => undefined);
  }, [slug]);

  if (missing) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-display text-3xl font-bold">ग्यालरी भेटिएन</h1>
        <Link to="/gallery" className="mt-4 inline-block text-crimson">
          ग्यालरीमा फर्कनुहोस्
        </Link>
      </div>
    );
  }
  if (!post) return <div className="h-48 animate-pulse rounded-2xl bg-chip" />;

  const photos = albumPhotos(post);

  return (
    <article className="mx-auto max-w-3xl">
      <p className="kicker">{post.place}</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold">{post.title}</h1>
      {post.blurb ? <p className="mt-3 text-ink-soft">{post.blurb}</p> : null}
      <p className="mt-3 inline-flex items-center gap-1 text-sm text-crimson">
        <Eye className="size-4" /> {toNpDigits(views || post.views || 0)} पटक हेरियो
      </p>
      <ShareBar path={`/gallery/${post.slug}`} title={post.title} />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((ph, i) => (
          <button
            key={`${ph.id}-${i}`}
            type="button"
            onClick={() => setOpen(i)}
            className="overflow-hidden rounded-2xl border border-line"
          >
            <img src={ph.imageUrl} alt={ph.caption} className="h-36 w-full object-cover sm:h-44" />
          </button>
        ))}
      </div>
      {open !== null ? (
        <GalleryLightbox
          title={post.title}
          photos={photos}
          index={open}
          onClose={() => setOpen(null)}
          onIndex={setOpen}
        />
      ) : null}
    </article>
  );
}
