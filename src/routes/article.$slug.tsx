import { Link, createFileRoute } from "@tanstack/react-router";
import { Bookmark, BookmarkCheck, Eye, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { ArticleCard } from "@/components/article-card";
import { AdSlot } from "@/components/ad-slot";
import { MembersWidget } from "@/components/members-widget";
import { PostSidebar } from "@/components/post-sidebar";
import { ShareBar } from "@/components/share-bar";
import { StoryEngage } from "@/components/story-engage";
import { TextResizer } from "@/components/text-resizer";
import { NewsTitle } from "@/components/news-title";
import { AuthorByline } from "@/components/author-byline";
import { articleCategories, byLatest, displayTitle, toNpDigits } from "@/data/articles";
import { formatBsDateTime } from "@/lib/bs-date";
import { getPublishedStory } from "@/lib/desk";
import { deskToArticle, useEdition, useEditionArticle } from "@/lib/edition";
import { getStoryEngagement } from "@/lib/engagement";
import { usePrefs } from "@/lib/prefs";
import { categoryLabel, useCategories } from "@/lib/use-categories";
import { incrementView } from "@/lib/views";
import { sharePageMeta } from "@/lib/site-url";

export const Route = createFileRoute("/article/$slug")({
  loader: ({ params }) => getPublishedStory({ data: { slug: params.slug } }),
  head: ({ loaderData, params }) => {
    const story = loaderData;
    const slug = story?.slug || params.slug;
    const headline = story?.title?.trim() || "KalaiyaOnline";
    const desc = story?.excerpt || story?.body || "";
    return sharePageMeta({
      title: headline,
      description: desc,
      path: `/article/${encodeURIComponent(slug)}`,
      imagePath: story?.imageUrl || `/api/og/article/${encodeURIComponent(slug)}`,
    });
  },
  component: ArticlePage,
});

function ArticlePage() {
  const { slug } = Route.useParams();
  const loaded = Route.useLoaderData();
  const fromLoader = loaded
    ? (() => {
        try {
          return deskToArticle(loaded);
        } catch {
          return null;
        }
      })()
    : null;
  const { article: editionArticle, missing } = useEditionArticle(slug);
  const article = fromLoader ?? editionArticle;
  const edition = useEdition();
  const { toggleSaved, isSaved, textScale } = usePrefs();
  const cats = useCategories();
  const [views, setViews] = useState(0);
  const [comments, setComments] = useState(0);

  useEffect(() => {
    if (!slug) return;
    void incrementView({ data: { kind: "story", key: slug } })
      .then((row) => setViews(row.views))
      .catch(() => undefined);
    void getStoryEngagement({ data: { slug } })
      .then((row) => setComments(row.comments.length))
      .catch(() => undefined);
  }, [slug]);

  if (!article && missing) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <p className="kicker">समाचार</p>
        <h1 className="mt-2 font-display text-4xl font-bold">यो रिपोर्ट भेटिएन</h1>
        <Link
          to="/"
          className="mt-6 inline-flex min-h-11 items-center rounded-full bg-crimson px-4 text-sm font-semibold text-paper"
        >
          गृहपृष्ठ
        </Link>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="h-10 w-2/3 animate-pulse rounded bg-chip" />
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-chip" />
      </div>
    );
  }

  const title = displayTitle(article);
  const saved = isSaved(article.slug);
  const mine = articleCategories(article);
  const related = edition
    .filter((a) => a.slug !== article.slug && articleCategories(a).some((c) => mine.includes(c)))
    .sort(byLatest)
    .slice(0, 2);
  const paragraphs = article.body.length ? article.body : [article.excerpt];

  return (
    <article className="pb-6">
      <AdSlot slot="article-top" className="mb-6" />

      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0">
      <div className="overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-sm">
        <header className="px-5 pt-7 text-center sm:px-10">
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[13px] font-semibold text-crimson">
            {articleCategories(article).map((slug, i) => (
              <span key={slug} className="inline-flex items-center gap-2">
                {i > 0 ? <span className="text-line-strong">·</span> : null}
                <Link to="/category/$slug" params={{ slug }} className="hover:underline">
                  {categoryLabel(cats, slug)}
                </Link>
              </span>
            ))}
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold leading-[1.25] text-ink sm:text-[2.6rem]">
            <NewsTitle text={title} />
          </h1>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm font-bold text-ink-soft">
            <AuthorByline article={article} />
            <span className="font-normal text-line-strong">·</span>
            <span>{formatBsDateTime(article.date)}</span>
            <span className="font-normal text-line-strong">·</span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="size-3.5" />
              {toNpDigits(comments)}
            </span>
            <span className="font-normal text-line-strong">·</span>
            <span className="inline-flex items-center gap-1">
              <Eye className="size-3.5" />
              {toNpDigits(views)}
            </span>
          </div>
          <div className="mx-auto mt-5 h-px max-w-xs bg-line" />
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 pb-1">
            <TextResizer />
            <button
              type="button"
              onClick={() => toggleSaved(article.slug)}
              className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-crimson"
            >
              {saved ? <BookmarkCheck className="size-4 text-crimson" /> : <Bookmark className="size-4" />}
              {saved ? "सुरक्षित" : "सेभ"}
            </button>
          </div>
        </header>

        {article.excerpt ? (
          <p className="mx-5 mt-4 rounded-2xl bg-[#f6f6f6] px-5 py-4 text-center text-lg leading-relaxed sm:mx-8">
            {article.excerpt}
          </p>
        ) : null}

        {article.imageUrl ? (
          <figure className="mt-6 px-5 sm:px-8">
            <img src={article.imageUrl} alt={title} className="max-h-[32rem] w-full rounded-2xl object-cover" />
          </figure>
        ) : null}

        <div className="px-5 py-8 sm:px-8">
          <div
            className="article-body space-y-6 font-display leading-[1.9] text-ink"
            style={{ fontSize: `${1.15 * textScale}rem` }}
          >
            {paragraphs.map((p, i) => (
              <p key={`${i}-${p.slice(0, 16)}`}>{p}</p>
            ))}
          </div>
          {article.tags.length ? (
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {article.tags.map((tag) => (
                <Link
                  key={tag}
                  to="/search"
                  search={{ q: tag }}
                  className="rounded-full bg-[#e7f4eb] px-3 py-1 text-xs font-semibold text-[#0b6b38] hover:bg-[#14934e] hover:text-white"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          ) : null}
          <ShareBar path={`/article/${article.slug}`} title={title} />
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-3xl">
        <AdSlot slot="article-bottom" className="mt-6" />
        <StoryEngage slug={article.slug} />
        {related.length ? (
          <section className="mt-10">
            <h2 className="mb-4 text-center font-display text-2xl">
              सम्बन्धित {categoryLabel(cats, article.category)}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {related.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </section>
        ) : null}
        <div className="mt-8">
          <MembersWidget />
        </div>
      </div>
      </div>
      <PostSidebar articles={edition} currentSlug={article.slug} />
      </div>
    </article>
  );
}
