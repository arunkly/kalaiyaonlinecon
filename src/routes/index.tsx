import { Link, createFileRoute } from "@tanstack/react-router";
import { CalendarDays, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { byLatest, displayTitle, isHeadlineArticle, toNpDigits, type Article } from "@/data/articles";
import { formatBsDateTime } from "@/lib/bs-date";
import { listPublishedStories } from "@/lib/desk";
import { deskToArticle } from "@/lib/edition";
import { getStoryEngagement } from "@/lib/engagement";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [stories, setStories] = useState<Article[]>([]);
  const [comments, setComments] = useState<Record<string, number>>({});

  useEffect(() => {
    void listPublishedStories()
      .then((rows) => {
        const headlines = (rows ?? [])
          .flatMap((row) => {
            try {
              return [deskToArticle(row)];
            } catch {
              return [];
            }
          })
          .filter((a) => isHeadlineArticle(a))
          .sort(byLatest)
          .slice(0, 2);
        setStories(headlines);
      })
      .catch(() => setStories([]));
  }, []);

  useEffect(() => {
    if (!stories.length) return;
    void Promise.all(
      stories.map((a) =>
        getStoryEngagement({ data: { slug: a.slug } })
          .then((row) => [a.slug, row.comments.length] as const)
          .catch(() => [a.slug, 0] as const),
      ),
    ).then((rows) => {
      const map: Record<string, number> = {};
      for (const [slug, n] of rows) map[slug] = n;
      setComments(map);
    });
  }, [stories]);

  if (!stories.length) {
    return <div className="min-h-[30vh]" />;
  }

  return (
    <div className="mx-auto max-w-4xl py-6 sm:py-8">
      {stories.map((article) => (
        <div key={article.slug}>
          <Link to="/article/$slug" params={{ slug: article.slug }} className="block">
            <h2 className="text-center font-display text-[35px] font-bold leading-[1.25] text-ink md:text-[40px] lg:text-[60px]">
              {displayTitle(article)}
            </h2>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-crimson/20 bg-chip px-3 py-1.5">
                <img src="/logo.jpg" alt="" className="size-6 rounded-full object-cover" />
                <span className="text-sm font-bold text-crimson">कलैयाअनलाइन</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink-soft">
                <CalendarDays className="size-4 text-mark" />
                {formatBsDateTime(article.date)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink-soft">
                <MessageSquare className="size-4 text-crimson" />
                {toNpDigits(comments[article.slug] ?? 0)}
              </span>
            </div>
            {article.imageUrl ? (
              <img src={article.imageUrl} alt="" className="mt-6 w-full object-cover" />
            ) : null}
          </Link>
          <div className="my-10 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-line-strong to-mark/70" />
            <span className="size-1.5 rotate-45 bg-crimson" />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent via-line-strong to-mark/70" />
          </div>
        </div>
      ))}
    </div>
  );
}
