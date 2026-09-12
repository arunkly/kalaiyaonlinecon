import { Link, createFileRoute } from "@tanstack/react-router";
import { CalendarDays, ChevronRight, Globe, MapPin, MessageSquare, Newspaper } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ArticleCard } from "@/components/article-card";
import { PostSidebar } from "@/components/post-sidebar";
import {
  articleCategories,
  articleHasCategory,
  byLatest,
  displayTitle,
  isHeadlineArticle,
  toNpDigits,
  type Article,
} from "@/data/articles";
import { formatBsDateTime } from "@/lib/bs-date";
import { cn } from "@/lib/cn";
import { listPublishedStories, type DeskCategory } from "@/lib/desk";
import { deskToArticle } from "@/lib/edition";
import { getStoryEngagement } from "@/lib/engagement";
import { categoryLabel, useCategories } from "@/lib/use-categories";
import { NewsTitle } from "@/components/news-title";
import { AuthorByline } from "@/components/author-byline";
import { sharePageMeta } from "@/lib/site-url";

export const Route = createFileRoute("/")({
  component: Home,
  head: () =>
    sharePageMeta({
      title: "KalaiyaOnline",
      description: "कलैयाअनलाइन — कलैया, बारा र मधेशको स्थानीय समाचार।",
      path: "/",
      imagePath: "/og.jpg",
      type: "website",
    }),
});

const DESK_TABS = [
  { slug: "news", label: "राष्ट्रिय", aliases: ["news", "समाचार", "राष्ट्रिय", "national"], icon: Newspaper },
  { slug: "local", label: "स्थानीय", aliases: ["local", "स्थानीय", "स्थानिय"], icon: MapPin },
  { slug: "international", label: "अन्तर्राष्ट्रिय", aliases: ["international", "अन्तर्राष्ट्रिय", "world"], icon: Globe },
] as const;

const AFTER_BLOCKS = [
  { slug: "politics", label: "राजनीति", aliases: ["politics", "राजनीति"] },
  { slug: "business", label: "व्यापार", aliases: ["business", "व्यापार"] },
  { slug: "sports", label: "खेलकुद", aliases: ["sports", "खेलकुद", "खेल"] },
  { slug: "health", label: "स्वास्थ्य", aliases: ["health", "स्वास्थ्य"] },
  { slug: "tech", label: "टेक", aliases: ["tech", "टेक", "technology", "प्रविधि"] },
] as const;

function headlineCategory(article: Article, cats: DeskCategory[]) {
  const slugs = articleCategories(article).filter((s) => s !== "headline" && s !== "हेडलाइन");
  const fallback = article.category !== "headline" && article.category !== "हेडलाइन" ? article.category : "";
  const slug = slugs[0] || fallback;
  return slug ? categoryLabel(cats, slug) : "";
}

function pickStories(edition: Article[], aliases: readonly string[], exclude: Set<string>, limit = 5) {
  return edition
    .filter((a) => !exclude.has(a.slug) && aliases.some((key) => articleHasCategory(a, key, key)))
    .slice(0, limit);
}

function MiniNews({ article }: { article: Article }) {
  return (
    <Link
      to="/article/$slug"
      params={{ slug: article.slug }}
      className="group flex gap-3 overflow-hidden rounded-xl border border-line bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:border-crimson/35 hover:shadow-md"
    >
      {article.imageUrl ? (
        <img
          src={article.imageUrl}
          alt=""
          className="h-[5.5rem] w-[6.5rem] shrink-0 rounded-lg object-cover sm:h-24 sm:w-28"
        />
      ) : (
        <span className="h-[5.5rem] w-[6.5rem] shrink-0 rounded-lg bg-gradient-to-br from-crimson to-ink sm:h-24 sm:w-28" />
      )}
      <span className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
        <span className="line-clamp-3 font-display text-[17px] font-semibold leading-snug text-ink group-hover:text-crimson">
          <NewsTitle text={displayTitle(article)} />
        </span>
        <span className="mt-2 text-xs text-muted">{formatBsDateTime(article.date)}</span>
      </span>
    </Link>
  );
}

function CategoryBlock({
  slug,
  label,
  items,
}: {
  slug: string;
  label: string;
  items: Article[];
}) {
  if (!items.length) return null;
  return (
    <section>
      <div className="mb-4 flex items-center justify-between border-b-[3px] border-crimson">
        <h2 className="bg-crimson px-4 py-1.5 font-display text-lg font-bold text-white sm:text-xl">
          {label}
        </h2>
        <Link
          to="/category/$slug"
          params={{ slug }}
          className="inline-flex items-center gap-1 px-2 text-sm font-semibold text-crimson hover:underline"
        >
          थप
          <ChevronRight className="size-4" />
        </Link>
      </div>
      {items[0] ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <ArticleCard article={items[0]} variant="lead" />
        </div>
      ) : null}
      {items.length > 1 ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {items.slice(1).map((article) => (
            <MiniNews key={article.slug} article={article} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function DeskTabs({
  edition,
  exclude,
}: {
  edition: Article[];
  exclude: Set<string>;
}) {
  const [tab, setTab] = useState<(typeof DESK_TABS)[number]["slug"]>("news");
  const active = DESK_TABS.find((t) => t.slug === tab) ?? DESK_TABS[0];
  const items = pickStories(edition, active.aliases, exclude, 5);
  const featured = items[0];
  const rest = items.slice(1);

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-[0_24px_50px_-32px_rgba(80,20,20,0.55)]">
      <div className="bg-[linear-gradient(135deg,#7a1220_0%,#9B1C2C_46%,#c45a22_100%)] px-3 py-5 text-white sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">समाचार</h2>
          </div>
          <Link
            to="/category/$slug"
            params={{ slug: active.slug }}
            className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold hover:bg-white/25"
          >
            थप
            <ChevronRight className="size-4" />
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-1 rounded-full bg-black/20 p-1 ring-1 ring-white/15">
          {DESK_TABS.map((item) => {
            const Icon = item.icon;
            const on = item.slug === tab;
            return (
              <button
                key={item.slug}
                type="button"
                onClick={() => setTab(item.slug)}
                className={cn(
                  "flex min-h-11 items-center justify-center gap-1.5 rounded-full px-1 text-[13px] font-semibold transition sm:text-[15px]",
                  on
                    ? "bg-white font-bold text-black shadow-[0_8px_18px_-10px_rgba(0,0,0,0.55)]"
                    : "text-white/80 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon className="hidden size-4 sm:block" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="p-3 sm:p-4">
        {!featured ? (
          <p className="py-10 text-center text-sm text-muted">यो डेस्कमा समाचार छैन।</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <Link
              to="/article/$slug"
              params={{ slug: featured.slug }}
              className="group relative isolate min-h-64 overflow-hidden rounded-2xl bg-ink sm:min-h-[22rem]"
            >
              {featured.imageUrl ? (
                <img
                  src={featured.imageUrl}
                  alt=""
                  className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105"
                />
              ) : (
                <span className="absolute inset-0 bg-gradient-to-br from-crimson to-ink" />
              )}
              <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-transparent" />
              <span className="absolute left-4 top-4 rounded-full bg-mark px-3 py-1 text-[11px] font-bold text-ink">
                {active.label}
              </span>
              <span className="absolute inset-x-0 bottom-0 p-5 text-white">
                <span className="block font-display text-2xl font-bold leading-snug sm:text-3xl">
                  <NewsTitle text={displayTitle(featured)} />
                </span>
                <span className="mt-2 block text-sm text-white/75">
                  {formatBsDateTime(featured.date)}
                </span>
              </span>
            </Link>
            <ul className="divide-y divide-line rounded-2xl border border-line bg-[#fffdf8]">
              {rest.map((article) => (
                <li key={article.slug}>
                  <Link
                    to="/article/$slug"
                    params={{ slug: article.slug }}
                    className="flex gap-3 p-3 hover:bg-[#fff6ea]"
                  >
                    {article.imageUrl ? (
                      <img
                        src={article.imageUrl}
                        alt=""
                        className="size-[4.25rem] shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="size-[4.25rem] shrink-0 rounded-lg bg-chip" />
                    )}
                    <span className="min-w-0">
                      <span className="line-clamp-3 font-display text-[17px] font-semibold leading-snug text-ink">
                        <NewsTitle text={displayTitle(article)} />
                      </span>
                      <span className="mt-1 block text-xs text-muted">
                        {formatBsDateTime(article.date)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function Home() {
  const [edition, setEdition] = useState<Article[]>([]);
  const [comments, setComments] = useState<Record<string, number>>({});
  const cats = useCategories();

  useEffect(() => {
    void listPublishedStories()
      .then((rows) => {
        setEdition(
          (rows ?? [])
            .flatMap((row) => {
              try {
                return [deskToArticle(row)];
              } catch {
                return [];
              }
            })
            .sort(byLatest),
        );
      })
      .catch(() => setEdition([]));
  }, []);

  const headlines = useMemo(
    () => edition.filter((a) => isHeadlineArticle(a)).slice(0, 2),
    [edition],
  );

  const used = useMemo(() => new Set(headlines.map((a) => a.slug)), [headlines]);

  const laterBlocks = useMemo(() => {
    const skip = new Set(used);
    for (const tab of DESK_TABS) {
      for (const a of pickStories(edition, tab.aliases, skip, 5)) skip.add(a.slug);
    }
    return AFTER_BLOCKS.map((block) => {
      const items = pickStories(edition, block.aliases, skip, 5);
      for (const a of items) skip.add(a.slug);
      return { ...block, items };
    });
  }, [edition, used]);

  useEffect(() => {
    if (!headlines.length) return;
    void Promise.all(
      headlines.map((a) =>
        getStoryEngagement({ data: { slug: a.slug } })
          .then((row) => [a.slug, row.comments.length] as const)
          .catch(() => [a.slug, 0] as const),
      ),
    ).then((rows) => {
      const map: Record<string, number> = {};
      for (const [slug, n] of rows) map[slug] = n;
      setComments(map);
    });
  }, [headlines]);

  if (!edition.length) {
    return <div className="min-h-[30vh]" />;
  }

  return (
    <div className="space-y-4 py-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        {headlines.map((article) => {
          const cat = headlineCategory(article, cats);
          return (
          <div key={article.slug}>
            <article className="rounded-[1.6rem] border border-line bg-white px-4 py-6 shadow-sm sm:px-8 sm:py-8">
              <Link to="/article/$slug" params={{ slug: article.slug }} className="group block">
                {cat ? (
                  <div className="mb-5 flex justify-center">
                    <span className="inline-flex -skew-x-12 items-center bg-gradient-to-r from-[#9B1C2C] to-[#c2410c] px-5 py-1.5 shadow-md">
                      <span className="skew-x-12 text-[13px] font-bold tracking-[0.2em] text-white">
                        {cat}
                      </span>
                    </span>
                  </div>
                ) : null}
                <h2 className="text-center font-display text-[35px] font-bold leading-[1.22] text-ink md:text-[40px] lg:text-[50px]">
                  <NewsTitle text={displayTitle(article)} />
                </h2>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-ink-soft">
                  <AuthorByline article={article} />
                  <span className="text-line-strong">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-4 text-mark" />
                    {formatBsDateTime(article.date)}
                  </span>
                  <span className="text-line-strong">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <MessageSquare className="size-4 text-crimson" />
                    {toNpDigits(comments[article.slug] ?? 0)}
                  </span>
                </div>
                <div className="relative mt-6 overflow-hidden rounded-[1.4rem] bg-chip">
                  {article.imageUrl ? (
                    <img
                      src={article.imageUrl}
                      alt=""
                      className="aspect-[16/9] w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="aspect-[16/9] w-full bg-gradient-to-br from-crimson to-ink" />
                  )}
                </div>
                {article.excerpt ? (
                  <p className="mt-5 line-clamp-2 text-center text-base leading-relaxed text-ink-soft sm:text-lg">
                    {article.excerpt}
                  </p>
                ) : null}
              </Link>
            </article>
            <div className="my-8 flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-line-strong to-mark/70" />
              <span className="size-1.5 rotate-45 bg-crimson" />
              <span className="h-px flex-1 bg-gradient-to-l from-transparent via-line-strong to-mark/70" />
            </div>
          </div>
          );
        })}
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-10">
          <DeskTabs edition={edition} exclude={used} />
          {laterBlocks.map((block) => (
            <CategoryBlock
              key={block.slug}
              slug={block.slug}
              label={block.label}
              items={block.items}
            />
          ))}
        </div>
        <PostSidebar articles={edition} limit={7} />
      </div>
    </div>
  );
}
