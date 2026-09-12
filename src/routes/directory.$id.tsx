import { Link, createFileRoute } from "@tanstack/react-router";
import { Eye, Mail, MapPin, Phone, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { ShareBar } from "@/components/share-bar";
import { formatBsDateTime } from "@/lib/bs-date";
import { toNpDigits } from "@/data/articles";
import { getDirEntry, getMapSettings, listDirCategories, type DirItem } from "@/lib/directory-desk";
import { DEFAULT_MAP, mapEmbedSrc, mapOpenUrl, type MapSettings } from "@/lib/map-embed";
import { incrementView } from "@/lib/views";
import { sharePageMeta } from "@/lib/site-url";

export const Route = createFileRoute("/directory/$id")({
  loader: ({ params }) => getDirEntry({ data: { id: Number(params.id) } }),
  head: ({ loaderData, params }) => {
    const item = loaderData;
    const id = String(item?.id ?? params.id);
    return sharePageMeta({
      title: item?.name?.trim() || "KalaiyaOnline",
      description: item?.place || "डाइरेक्ट्री",
      path: `/directory/${encodeURIComponent(id)}`,
      imagePath: `/share-image/directory/${encodeURIComponent(id)}.jpg`,
      imageUrl: item?.imageUrl,
    });
  },
  component: DirectoryPostPage,
});

function DirectoryPostPage() {
  const { id } = Route.useParams();
  const num = Number(id);
  const [item, setItem] = useState<DirItem | null>(null);
  const [label, setLabel] = useState("");
  const [mapCfg, setMapCfg] = useState<MapSettings>(DEFAULT_MAP);
  const [views, setViews] = useState(0);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!num) {
      setMissing(true);
      return;
    }
    void getDirEntry({ data: { id: num } }).then((row) => {
      setItem(row);
      setMissing(!row);
    });
    void listDirCategories().then((cats) => {
      /* filled after item */
      void getDirEntry({ data: { id: num } }).then((row) => {
        setLabel(cats.find((c) => c.slug === row?.category)?.label ?? "");
      });
    });
    void getMapSettings().then(setMapCfg);
    void incrementView({ data: { kind: "directory", key: String(num) } })
      .then((r) => setViews(r.views))
      .catch(() => undefined);
  }, [num]);

  if (missing) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-display text-3xl font-bold">प्रविष्टि भेटिएन</h1>
        <Link to="/directory" className="mt-4 inline-block text-crimson">
          डाइरेक्ट्री
        </Link>
      </div>
    );
  }
  if (!item) return <div className="h-48 animate-pulse rounded-2xl bg-chip" />;

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <p className="text-sm">
        <Link to="/directory" className="text-crimson">
          डाइरेक्ट्री
        </Link>
        <span className="text-muted"> / {label || item.category}</span>
      </p>
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.name} className="w-full rounded-3xl object-cover" />
      ) : (
        <div className="grid h-40 place-items-center rounded-3xl bg-chip text-muted">तस्बिर छैन</div>
      )}
      <div>
        <p className="kicker">{label || item.category}</p>
        <h1 className="mt-2 font-display text-3xl font-normal sm:text-4xl">{item.name}</h1>
        {item.createdAt ? <p className="mt-1 text-sm text-muted">{formatBsDateTime(item.createdAt)}</p> : null}
        <p className="mt-2 inline-flex items-center gap-1 text-sm text-crimson">
          <Eye className="size-4" /> {toNpDigits(views || item.views || 0)} पटक हेरियो
        </p>
      </div>
      {item.note ? (
        <section>
          <p className="text-[11px] font-bold tracking-[0.16em] text-muted">विवरण</p>
          <p className="mt-2 whitespace-pre-wrap text-lg leading-relaxed">{item.note}</p>
        </section>
      ) : null}
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface px-4 py-3">
          <dt className="inline-flex items-center gap-2 text-xs text-muted">
            <Tag className="size-4 text-crimson" /> Category
          </dt>
          <dd className="mt-1 font-semibold">{label || item.category}</dd>
        </div>
        <div className="rounded-xl border border-line bg-surface px-4 py-3">
          <dt className="inline-flex items-center gap-2 text-xs text-muted">
            <MapPin className="size-4 text-crimson" /> Location
          </dt>
          <dd className="mt-1 font-semibold">{item.place}</dd>
        </div>
        {item.phone ? (
          <div className="rounded-xl border border-line bg-surface px-4 py-3">
            <dt className="inline-flex items-center gap-2 text-xs text-muted">
              <Phone className="size-4 text-crimson" /> Phone
            </dt>
            <dd className="mt-1">
              <a href={`tel:${item.phone}`} className="font-semibold text-crimson">
                {item.phone}
              </a>
            </dd>
          </div>
        ) : null}
        {item.email ? (
          <div className="rounded-xl border border-line bg-surface px-4 py-3">
            <dt className="inline-flex items-center gap-2 text-xs text-muted">
              <Mail className="size-4 text-crimson" /> Email
            </dt>
            <dd className="mt-1">
              <a href={`mailto:${item.email}`} className="font-semibold text-crimson">
                {item.email}
              </a>
            </dd>
          </div>
        ) : null}
      </dl>
      <ShareBar path={`/directory/${item.id}`} title={item.name} />
      <section>
        <p className="mb-2 text-[11px] font-bold tracking-[0.16em] text-muted">नक्सा</p>
        <div className="overflow-hidden rounded-2xl border border-line">
          <iframe
            title={`${item.name} नक्सा`}
            src={mapEmbedSrc(mapCfg, item)}
            style={{ height: Math.max(mapCfg.height, 280) }}
            className="w-full"
            loading="lazy"
          />
          <a href={mapOpenUrl(item)} target="_blank" rel="noreferrer" className="block bg-chip px-3 py-2 text-sm font-semibold text-crimson">
            नक्सा खोल्नुहोस्
          </a>
        </div>
      </section>
    </article>
  );
}
