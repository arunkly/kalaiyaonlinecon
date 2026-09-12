import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { displayTitle, toNpDigits, type Article } from "@/data/articles";
import { formatBsDateTime } from "@/lib/bs-date";
import { NewsTitle } from "@/components/news-title";
import { cn } from "@/lib/cn";
import { listStoryViews } from "@/lib/views";

export function PostSidebar({
  articles,
  currentSlug,
  limit = 7,
  numbered = false,
}: {
  articles: Article[];
  currentSlug?: string;
  limit?: number;
  numbered?: boolean;
}) {
  const [tab, setTab] = useState<"latest" | "popular">("latest");
  const [views, setViews] = useState<Record<string, number>>({});

  useEffect(() => {
    void listStoryViews()
      .then((rows) => {
        const map: Record<string, number> = {};
        for (const r of rows) map[r.slug] = r.views;
        setViews(map);
      })
      .catch(() => undefined);
  }, []);

  const pool = useMemo(
    () => articles.filter((a) => a.slug !== currentSlug),
    [articles, currentSlug],
  );

  const latest = useMemo(
    () => [...pool].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit),
    [pool, limit],
  );

  const popular = useMemo(
    () =>
      [...pool]
        .sort((a, b) => (views[b.slug] ?? 0) - (views[a.slug] ?? 0) || b.date.localeCompare(a.date))
        .slice(0, limit),
    [pool, views, limit],
  );

  const list = tab === "latest" ? latest : popular;

  return (
    <aside className="lg:sticky lg:top-28">
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div className="grid grid-cols-2 border-b border-line">
          {(
            [
              ["latest", "ताजा"],
              ["popular", "लोकप्रिय"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "py-3 text-xs font-bold sm:text-sm",
                tab === id
                  ? id === "popular"
                    ? "bg-[#E87722] text-white"
                    : "bg-[#2E7D32] text-white"
                  : "bg-paper text-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <ul className="divide-y divide-line">
          {list.map((a, i) => (
            <li key={a.slug}>
              <Link
                to="/article/$slug"
                params={{ slug: a.slug }}
                className="flex gap-3 p-3 hover:bg-[#E8F5E9]"
              >
                <span className="w-7 shrink-0 pt-0.5 font-display text-xl font-semibold leading-none text-[#E87722]">
                  {toNpDigits(i + 1)}
                </span>
                {a.imageUrl ? (
                  <img src={a.imageUrl} alt="" className="size-16 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="size-16 shrink-0 rounded-lg bg-chip" />
                )}
                <span className="min-w-0">
                  <span className="line-clamp-3 font-display text-[17px] font-semibold leading-snug">
                    <NewsTitle text={displayTitle(a)} />
                  </span>
                  <span className="mt-1 block text-[11px] text-muted">{formatBsDateTime(a.date)}</span>
                </span>
              </Link>
            </li>
          ))}
          {list.length === 0 ? (
            <li className="p-4 text-sm text-muted">समाचार छैन।</li>
          ) : null}
        </ul>
      </div>
    </aside>
  );
}
